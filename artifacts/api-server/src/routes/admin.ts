/**
 * routes/admin.ts — Module Admin : référentiels, comptes utilisateurs, modèles d'email
 *
 * Référentiels (CRUD générique sur les tables référentielles, paramétré par nom de table) :
 *   GET    /api/admin/referentiels/:table       → liste toutes les lignes
 *   POST   /api/admin/referentiels/:table       → ajoute une ligne
 *   PATCH  /api/admin/referentiels/:table/:id   → modifie une ligne
 *
 * Comptes utilisateurs :
 *   GET    /api/admin/utilisateurs                         → liste (login, état du candidat, contact…)
 *   POST   /api/admin/utilisateurs                         → crée un Admin ou un Recruteur et l'invite
 *   PATCH  /api/admin/utilisateurs/:id                     → modifie login, actif et (Admin/Recruteur) le contact
 *   POST   /api/admin/utilisateurs/desactiver              → désactive en masse des candidats / CM
 *   POST   /api/admin/utilisateurs/:id/renvoyer-invitation → nouveau mot de passe provisoire + email
 *
 * Modèles d'email :
 *   GET    /api/admin/modeles-email                → les 6 modèles et leurs variables
 *   PATCH  /api/admin/modeles-email/:type          → modifie objet, texte, fréquence
 *   POST   /api/admin/modeles-email/:type/tester   → envoie un test à l'adresse de l'administrateur
 *
 * SÉCURITÉ CRITIQUE :
 *   Le nom de table venant du frontend est TOUJOURS validé contre une liste blanche
 *   (TABLES_CONFIG) avant d'être injecté dans une requête SQL. Sans cette validation,
 *   un attaquant pourrait construire une URL comme /referentiels/user_; DROP TABLE ...
 *   et provoquer une injection SQL (voir OWASP A03:2021).
 *
 * CONTRAINTE MÉTIER (ENF-12) :
 *   Un seul composant générique côté frontend, paramétré par table, pour limiter la
 *   charge de maintenance (la DCC n'a pas de ressource IT dédiée).
 *
 * Toutes les routes sont protégées par requireRole(['ADMIN']).
 */

import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'node:crypto';
import pool from '../db-pg';
import { requireRole } from '../middleware/requireRole';
import { assertEmailAvailable, EmailConflictError, normalizeEmail } from '../lib/emailRules';
import {
  applicationUrl,
  EMAIL_TYPES,
  isEmailType,
  loadAllTemplates,
  loadTemplate,
  sendTemplatedEmail,
  smtpIsConfigured,
  validateTemplate,
} from '../lib/emailTemplates';
import {
  issueNewTemporaryPassword,
  newTemporaryPassword,
  sendPendingAccountInvitations,
  type InvitationStatus,
} from '../services/accountCreation';

const router = Router();
/* CM est créé automatiquement à l'import des postes (routes/postes.ts), jamais depuis ce module. */
const USER_ROLES = ['ADMIN', 'RECRUTEUR'] as const;
type UserRole = typeof USER_ROLES[number];
const CONTACT_ROLES: Record<UserRole, readonly string[]> = {
  ADMIN: ['ADMIN'],
  RECRUTEUR: ['REC', 'CHZ'],
};
/* Rôles de contact dont l'identité est maîtrisée dans Passerelle : nom, prénom et email y sont modifiables.
   Les autres contacts (CM, CZ, MIS, PAR) sont mis à jour par l'import des postes (le CRM est maître), et le
   contact d'un candidat se corrige depuis l'écran État civil : un correctif fait ici serait écrasé ou serait
   source d'incohérence. */
const EDITABLE_CONTACT_ROLES = ['ADMIN', 'REC'];
const LOGIN_PATTERN = /^\S{3,50}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validUserPayload(body: unknown): { value?: { nom: string; prenom: string; email: string; telephone: string; genre: string; role_applicatif: UserRole; role_contact: string }; error?: string } {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return { error: 'Corps de requête invalide.' };
  const data = body as Record<string, unknown>;
  const allowed = ['nom', 'prenom', 'email', 'telephone', 'genre', 'role_applicatif', 'role_contact'];
  if (Object.keys(data).some((key) => !allowed.includes(key))) return { error: 'Champ non autorisé.' };
  const read = (key: string, max: number) => typeof data[key] === 'string' && data[key].trim().length > 0 && data[key].trim().length <= max ? data[key].trim() : null;
  const nom = read('nom', 50), prenom = read('prenom', 50), rawEmail = read('email', 50);
  const telephone = read('telephone', 50), genre = read('genre', 20);
  if (!nom || !prenom || !rawEmail || !telephone || !genre) return { error: 'Nom, prénom, email, téléphone et genre sont obligatoires.' };
  const email = normalizeEmail(rawEmail);
  if (!EMAIL_PATTERN.test(email)) return { error: 'Email invalide.' };
  if (!USER_ROLES.includes(data.role_applicatif as UserRole)) return { error: 'Rôle applicatif invalide.' };
  const role_applicatif = data.role_applicatif as UserRole;
  const role_contact = read('role_contact', 20);
  if (!role_contact || !CONTACT_ROLES[role_applicatif].includes(role_contact)) return { error: 'Rôle contact incompatible avec le rôle applicatif.' };
  return { value: { nom, prenom, email, telephone, genre, role_applicatif, role_contact } };
}

/** Une ligne de la liste des comptes (même forme pour la liste et après modification). */
const USER_SELECT = `
  SELECT u.id_user,u.login,u.active,u.role_applicatif,u.id_contact,
         c.crm_key,c.nom_contact AS nom,c.prenom_contact AS prenom,c.email_contact AS email,
         c.tel_contact AS telephone,c.genre,c.role AS role_contact,
         ec.id_etat_candidat AS etat_code,ec.designation AS etat_designation
  FROM user_ u
  JOIN contact c ON c.id_contact=u.id_contact
  LEFT JOIN candidat cand ON cand.id_contact=c.id_contact AND u.role_applicatif='CANDIDAT'
  LEFT JOIN etat_candidat ec ON ec.id_etat_candidat=cand.id_etat_candidat`;

router.get('/utilisateurs', requireRole(['ADMIN']), async (_req, res) => {
  try {
    const result = await pool.query(`${USER_SELECT} ORDER BY c.nom_contact,c.prenom_contact,u.id_user`);
    res.json(result.rows);
  } catch (error) {
    console.error('Erreur GET utilisateurs :', error);
    res.status(500).json({ error: 'Erreur interne du serveur.' });
  }
});

router.post('/utilisateurs', requireRole(['ADMIN']), async (req, res) => {
  const parsed = validUserPayload(req.body);
  if (!parsed.value) { res.status(400).json({ error: parsed.error }); return; }
  const data = parsed.value;
  const temporaryPassword = newTemporaryPassword();
  const contactCrmKey = `USR_${randomBytes(12).toString('hex').toUpperCase()}`;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await assertEmailAvailable(client, data.email, null);
    const contact = await client.query(
      `INSERT INTO contact(crm_key,role,genre,nom_contact,prenom_contact,tel_contact,email_contact)
       VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING id_contact`,
      [contactCrmKey, data.role_contact, data.genre, data.nom, data.prenom, data.telephone, data.email],
    );
    const user = await client.query(
      `INSERT INTO user_(login,password,id_contact,role_applicatif,active)
       VALUES($1,$2,$3,$4,true) RETURNING id_user,active`,
      [data.email, await bcrypt.hash(temporaryPassword, 12), contact.rows[0].id_contact, data.role_applicatif],
    );
    await client.query('COMMIT');
    const summary = await sendPendingAccountInvitations(pool, [{
      email: data.email, identifiant: data.email, prenom: data.prenom, temporaryPassword,
      roleLabel: data.role_applicatif, emailMode: 'utilisateur',
    }]);
    const invitation: 'sent' | 'failed' | 'pending_smtp_configuration' = summary.status === 'sent' ? 'sent' : summary.status === 'pending_smtp_configuration' ? 'pending_smtp_configuration' : 'failed';
    res.status(201).json({ ...user.rows[0], id_contact: contact.rows[0].id_contact, ...data, login: data.email, invitation });
  } catch (error: any) {
    try { await client.query('ROLLBACK'); } catch { /* transaction déjà validée */ }
    if (error instanceof EmailConflictError) { res.status(409).json({ error: error.message }); return; }
    console.error('Erreur POST utilisateurs :', error);
    if (error?.code === '23505') { res.status(409).json({ error: 'Un compte ou contact avec ces données existe déjà.' }); return; }
    res.status(500).json({ error: 'Erreur interne du serveur.' });
  } finally { client.release(); }
});

/**
 * PATCH /api/admin/utilisateurs/:id — modifie un compte.
 *   - login : modifiable à part (jamais reporté automatiquement depuis l'email dans cet écran) ;
 *   - active : désactivation IMMÉDIATE (voir middleware/requireRole.ts), interdite pour soi-même et pour
 *     le dernier administrateur actif ;
 *   - nom, prénom, email du contact : uniquement si le contact est un Admin ou un Recruteur (REC).
 * Le rôle applicatif n'est jamais modifiable.
 */
router.patch('/utilisateurs/:id', requireRole(['ADMIN']), async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) { res.status(400).json({ error: 'Identifiant utilisateur invalide.' }); return; }
  const body = req.body as Record<string, unknown> | undefined;
  if (!body || typeof body !== 'object' || Array.isArray(body)) { res.status(400).json({ error: 'Corps de requête invalide.' }); return; }
  const allowed = ['login', 'active', 'nom', 'prenom', 'email'];
  if (Object.keys(body).some((key) => !allowed.includes(key))) { res.status(400).json({ error: 'Champ non modifiable (le rôle applicatif ne peut jamais être modifié).' }); return; }

  const text = (key: string, max: number) => (typeof body[key] === 'string' ? (body[key] as string).trim().slice(0, max + 1) : undefined);
  const login = 'login' in body ? normalizeEmail(body.login) : undefined;
  const nom = 'nom' in body ? text('nom', 50) : undefined;
  const prenom = 'prenom' in body ? text('prenom', 50) : undefined;
  const email = 'email' in body ? normalizeEmail(body.email) : undefined;
  if ('login' in body && (!login || !LOGIN_PATTERN.test(login))) { res.status(400).json({ error: 'Le login est obligatoire : 3 à 50 caractères, sans espace.' }); return; }
  if ('active' in body && typeof body.active !== 'boolean') { res.status(400).json({ error: 'Le champ « actif » doit valoir oui ou non.' }); return; }
  if (nom !== undefined && (!nom || nom.length > 50)) { res.status(400).json({ error: 'Le nom est obligatoire (50 caractères maximum).' }); return; }
  if (prenom !== undefined && (!prenom || prenom.length > 50)) { res.status(400).json({ error: 'Le prénom est obligatoire (50 caractères maximum).' }); return; }
  if (email !== undefined && (!EMAIL_PATTERN.test(email) || email.length > 50)) { res.status(400).json({ error: 'Email invalide (50 caractères maximum).' }); return; }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const found = await client.query(
      `SELECT u.id_user,u.login,u.active,u.role_applicatif,u.id_contact,
              c.nom_contact,c.prenom_contact,c.email_contact,c.role AS role_contact
         FROM user_ u JOIN contact c ON c.id_contact=u.id_contact
        WHERE u.id_user=$1 FOR UPDATE OF u,c`,
      [id],
    );
    if (!found.rows.length) { await client.query('ROLLBACK'); res.status(404).json({ error: 'Utilisateur non trouvé.' }); return; }
    const current = found.rows[0];

    const contactChange = (nom !== undefined && nom !== current.nom_contact)
      || (prenom !== undefined && prenom !== current.prenom_contact)
      || (email !== undefined && email !== normalizeEmail(current.email_contact));
    if (contactChange && !EDITABLE_CONTACT_ROLES.includes(current.role_contact)) {
      await client.query('ROLLBACK');
      res.status(403).json({ error: 'Ce contact est géré ailleurs (import des postes du CRM, ou écran État civil du candidat) : il ne peut pas être modifié ici.' });
      return;
    }

    if (body.active === false && current.active !== false) {
      if (id === req.user!.id_user) { await client.query('ROLLBACK'); res.status(409).json({ error: 'Vous ne pouvez pas désactiver votre propre compte.' }); return; }
      if (current.role_applicatif === 'ADMIN') {
        const others = await client.query("SELECT count(*)::int AS n FROM user_ WHERE role_applicatif='ADMIN' AND active AND id_user<>$1", [id]);
        if (others.rows[0].n === 0) { await client.query('ROLLBACK'); res.status(409).json({ error: 'Impossible de désactiver le dernier administrateur actif.' }); return; }
      }
    }

    if (login !== undefined && login !== current.login) await assertEmailAvailable(client, login, current.id_contact);
    if (email !== undefined && email !== normalizeEmail(current.email_contact)) await assertEmailAvailable(client, email, current.id_contact);

    if (login !== undefined && login !== current.login) await client.query('UPDATE user_ SET login=$1 WHERE id_user=$2', [login, id]);
    if (typeof body.active === 'boolean' && body.active !== current.active) await client.query('UPDATE user_ SET active=$1 WHERE id_user=$2', [body.active, id]);
    if (contactChange) {
      await client.query(
        'UPDATE contact SET nom_contact=COALESCE($1,nom_contact),prenom_contact=COALESCE($2,prenom_contact),email_contact=COALESCE($3,email_contact) WHERE id_contact=$4',
        [nom ?? null, prenom ?? null, email ?? null, current.id_contact],
      );
    }
    const updated = await client.query(`${USER_SELECT} WHERE u.id_user=$1`, [id]);
    await client.query('COMMIT');
    res.json(updated.rows[0]);
  } catch (error: any) {
    try { await client.query('ROLLBACK'); } catch { /* déjà terminée */ }
    if (error instanceof EmailConflictError) { res.status(409).json({ error: error.message }); return; }
    if (error?.code === '23505') { res.status(409).json({ error: 'Ce login ou cet email est déjà utilisé.' }); return; }
    console.error('Erreur PATCH utilisateur :', error);
    res.status(500).json({ error: 'Erreur interne du serveur.' });
  } finally { client.release(); }
});

/**
 * POST /api/admin/utilisateurs/desactiver — désactivation en masse (candidats et CM uniquement).
 * Les comptes Admin et Recruteur ne se désactivent qu'un par un depuis la fenêtre de modification,
 * ce qui exclut d'office son propre compte et le dernier administrateur.
 */
router.post('/utilisateurs/desactiver', requireRole(['ADMIN']), async (req, res) => {
  const rawIds = (req.body as { ids?: unknown } | undefined)?.ids;
  if (!Array.isArray(rawIds) || rawIds.length === 0 || rawIds.length > 1000 || !rawIds.every((value) => Number.isInteger(value) && value > 0)) {
    res.status(400).json({ error: 'Sélectionnez entre 1 et 1 000 comptes.' });
    return;
  }
  const ids = [...new Set(rawIds as number[])];
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const found = await client.query('SELECT id_user,role_applicatif FROM user_ WHERE id_user=ANY($1::int[]) FOR UPDATE', [ids]);
    if (found.rows.length !== ids.length) { await client.query('ROLLBACK'); res.status(404).json({ error: 'Un des comptes sélectionnés n’existe plus : rechargez la liste.' }); return; }
    if (found.rows.some((row) => !['CANDIDAT', 'CM'].includes(row.role_applicatif))) {
      await client.query('ROLLBACK');
      res.status(400).json({ error: 'La désactivation en masse ne concerne que les candidats et les chargés de mission. Les comptes Admin et Recruteur se désactivent un par un.' });
      return;
    }
    const updated = await client.query('UPDATE user_ SET active=false WHERE id_user=ANY($1::int[]) AND active RETURNING id_user', [ids]);
    await client.query('COMMIT');
    res.json({ desactives: updated.rows.length, deja_inactifs: ids.length - updated.rows.length });
  } catch (error) {
    try { await client.query('ROLLBACK'); } catch { /* déjà terminée */ }
    console.error('Erreur désactivation en masse :', error);
    res.status(500).json({ error: 'Erreur interne du serveur.' });
  } finally { client.release(); }
});

/** POST /api/admin/utilisateurs/:id/renvoyer-invitation — nouveau mot de passe provisoire + email d'invitation. */
router.post('/utilisateurs/:id/renvoyer-invitation', requireRole(['ADMIN']), async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) { res.status(400).json({ error: 'Identifiant utilisateur invalide.' }); return; }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const invitation = await issueNewTemporaryPassword(client, id);
    if (!invitation) { await client.query('ROLLBACK'); res.status(404).json({ error: 'Utilisateur non trouvé.' }); return; }
    if (!invitation.active) { await client.query('ROLLBACK'); res.status(409).json({ error: 'Ce compte est désactivé : réactivez-le avant de renvoyer l’invitation.' }); return; }
    await client.query('COMMIT');
    const summary = await sendPendingAccountInvitations(pool, [invitation]);
    const status: InvitationStatus = summary.status;
    res.json({ invitation: status === 'sent' ? 'sent' : status === 'pending_smtp_configuration' ? 'pending_smtp_configuration' : 'failed' });
  } catch (error) {
    try { await client.query('ROLLBACK'); } catch { /* déjà terminée */ }
    console.error('Erreur renvoi d’invitation :', error);
    res.status(500).json({ error: 'Erreur interne du serveur.' });
  } finally { client.release(); }
});

/* ── Modèles d'email ─────────────────────────────────────────────────────────────────────────── */

router.get('/modeles-email', requireRole(['ADMIN']), async (_req, res) => {
  try {
    const templates = await loadAllTemplates(pool);
    res.json({
      smtp_configure: smtpIsConfigured(),
      modeles: templates.map((template) => ({
        ...template,
        variables: EMAIL_TYPES[template.email_type].variables,
        obligatoires: EMAIL_TYPES[template.email_type].obligatoires,
        groupable: EMAIL_TYPES[template.email_type].groupable,
      })),
    });
  } catch (error) {
    console.error('Erreur GET modèles d’email :', error);
    res.status(500).json({ error: 'Erreur interne du serveur.' });
  }
});

router.patch('/modeles-email/:type', requireRole(['ADMIN']), async (req, res) => {
  const type = req.params.type;
  if (!isEmailType(type)) { res.status(404).json({ error: 'Modèle d’email inconnu.' }); return; }
  const { objet, contenu, frequence_heures } = (req.body ?? {}) as Record<string, unknown>;
  const frequence = EMAIL_TYPES[type].groupable ? frequence_heures : 0;
  const check = validateTemplate(type, objet, contenu, frequence);
  if (!check.ok) { res.status(400).json({ error: check.error }); return; }
  try {
    const saved = await pool.query(
      `INSERT INTO email_template(email_type,libelle,objet,contenu,frequence_heures) VALUES($1,$2,$3,$4,$5)
       ON CONFLICT (email_type) DO UPDATE SET objet=EXCLUDED.objet,contenu=EXCLUDED.contenu,frequence_heures=EXCLUDED.frequence_heures
       RETURNING email_type,libelle,objet,contenu,frequence_heures`,
      [type, EMAIL_TYPES[type].libelle, (objet as string).trim(), contenu, frequence],
    );
    res.json(saved.rows[0]);
  } catch (error) {
    console.error('Erreur PATCH modèle d’email :', error);
    res.status(500).json({ error: 'Erreur interne du serveur.' });
  }
});

router.post('/modeles-email/:type/tester', requireRole(['ADMIN']), async (req, res) => {
  const type = req.params.type;
  if (!isEmailType(type)) { res.status(404).json({ error: 'Modèle d’email inconnu.' }); return; }
  if (!smtpIsConfigured()) { res.status(409).json({ error: 'La messagerie n’est pas configurée sur ce serveur (variables SMTP_*) : aucun email ne peut être envoyé.' }); return; }
  try {
    const me = await pool.query('SELECT c.email_contact,c.prenom_contact FROM user_ u JOIN contact c ON c.id_contact=u.id_contact WHERE u.id_user=$1', [req.user!.id_user]);
    const to = normalizeEmail(me.rows[0]?.email_contact);
    if (!to) { res.status(409).json({ error: 'Votre fiche n’a pas d’adresse email : impossible d’envoyer le test.' }); return; }
    const body = (req.body ?? {}) as Record<string, unknown>;
    const saved = await loadTemplate(pool, type);
    const objet = typeof body.objet === 'string' && body.objet.trim() ? body.objet : saved.objet;
    const contenu = typeof body.contenu === 'string' && body.contenu.trim() ? body.contenu : saved.contenu;
    const check = validateTemplate(type, objet, contenu, EMAIL_TYPES[type].groupable ? saved.frequence_heures : 0);
    if (!check.ok) { res.status(400).json({ error: check.error }); return; }
    const lien = type === 'REINITIALISATION_MDP' ? `${applicationUrl()}/login?reset_token=exemple` : applicationUrl();
    await sendTemplatedEmail(pool, type, to, {
      prenom: me.rows[0]?.prenom_contact ?? '', identifiant: to, mot_de_passe: 'Exemple-De-Mot-De-Passe-1', role: 'ADMIN', lien, nombre: 3,
    }, { objet: `[TEST] ${objet}`, contenu });
    res.json({ envoye_a: to });
  } catch (error) {
    console.error('Erreur envoi du test de modèle d’email :', error);
    res.status(502).json({ error: 'L’email de test n’a pas pu être envoyé (vérifiez les réglages SMTP).' });
  }
});

/** Configuration par table : clé primaire, colonnes éditables, restrictions */
const TABLES_CONFIG: Record<string, {
  pk: string;            // nom de la colonne clé primaire
  label: string;         // nom lisible pour l'UI
  editableFields: string[];  // colonnes autorisées en POST/PATCH
  restricted?: boolean;  // si true : POST et DELETE interdits (etat_candidat)
  restrictedFields?: string[]; // si restricted, seuls ces champs sont éditables
}> = {
  langue:            { pk: 'id_langue',         label: 'Langues',         editableFields: ['crm_key','designation','active'] },
  region:            { pk: 'id_region',         label: 'Régions',         editableFields: ['crm_key','designation','active'] },
  pays:              { pk: 'id_pays',           label: 'Pays',            editableFields: ['crm_key','designation','active','id_region'] },
  environnement:     { pk: 'id_environnement',  label: 'Environnements',  editableFields: ['crm_key','designation','niveau','active'] },
  duree:             { pk: 'id_duree',          label: 'Durées de mission',editableFields: ['crm_key','periode','statut','niveau','active'] },
  hebergement:       { pk: 'id_hebergement',    label: 'Hébergements',    editableFields: ['crm_key','designation','active'] },
  domaine:           { pk: 'id_domaine',        label: 'Domaines',        editableFields: ['crm_key','designation','active'] },
  competences:       { pk: 'id_competences',    label: 'Compétences',     editableFields: ['crm_key','designation','active','id_domaine'] },
  notoriete_dcc:     { pk: 'id_notoriete_dcc',  label: 'Notoriété DCC',   editableFields: ['crm_key','designation','active'] },
  statut_professionnel: { pk: 'id_statut_professionnel', label: 'Statut professionnel', editableFields: ['crm_key','designation','active'] },
  type_billet_avion: { pk: 'id_type_billet_avion', label: 'Type de billet d’avion', editableFields: ['crm_key','designation','active'] },
  // etat_poste / etat_opportunite : LECTURE SEULE (18/09/2026) — les transitions de poste et
  // d'opportunité sont pilotées par du texte codé en dur (ETATS_FERMABLES, transitionRules), pas
  // par un identifiant stable : renommer ou désactiver un état casserait le workflow en direct.
  // Ajouter un état ne servirait à rien non plus (jamais ciblé par un bouton d'action). Toute
  // mise à jour se fait donc par script SQL, jamais depuis cet écran — voir conception.md.
  etat_poste:        { pk: 'id_etat_poste',     label: 'États de poste',  editableFields: [], restricted: true, restrictedFields: [] },
  etat_opportunite:  { pk: 'id_etat_opportunite',label: 'États d\'opportunité', editableFields: [], restricted: true, restrictedFields: [] },
  niveau_langue:     { pk: 'id_niveau_langue',  label: 'Niveaux de langue',editableFields: ['crm_key','designation','ordre','active'] },
  stages:            { pk: 'id_stages',         label: 'Sessions Choisir',editableFields: ['type_stage','date_debut','date_fin','active','voeux_definitif_ouvert'] },
  aide_contextuelle: { pk: 'id_aide_contextuelle', label: 'Aides contextuelles', editableFields: ['cle_champ','texte','active'] },
  // etat_candidat : LECTURE SEULE (aligné le 18/09/2026 sur etat_poste/etat_opportunite — voir
  // note ci-dessus). Le front bloquait déjà toute édition ; le backend l'autorisait encore
  // techniquement (designation/delais_de_reponse) via un appel API direct — incohérence corrigée.
  etat_candidat:     {
    pk: 'id_etat_candidat',
    label: 'États candidat',
    editableFields: [],
    restricted: true,
    restrictedFields: [],
  },
};

/**
 * Vérifie que le nom de table est dans la liste blanche.
 * Retourne la config ou null si invalide.
 * C'est la protection principale contre l'injection SQL via le paramètre :table.
 */
function getTableConfig(tableName: string) {
  return TABLES_CONFIG[tableName] ?? null;
}

/**
 * GET /api/admin/referentiels/:table
 *
 * Retourne toutes les lignes de la table sélectionnée.
 * Pour les tables avec la colonne `active`, on retourne tout (actif et inactif)
 * afin que l'admin puisse réactiver des entrées désactivées.
 */
router.get('/referentiels/:table', requireRole(['ADMIN']), async (req, res) => {
  const config = getTableConfig(req.params.table as string);
  if (!config) {
    res.status(400).json({ error: `Table '${req.params.table}' non autorisée.` });
    return;
  }

  try {
    // On ne peut pas utiliser $1 pour le nom de table (paramètre SQL = valeurs seulement),
    // mais le nom est déjà validé contre la liste blanche ci-dessus.
    const result = await pool.query(`SELECT * FROM ${req.params.table as string} ORDER BY ${config.pk}`);
    // Le champ 'pk' est inclus dans la réponse pour que le frontend identifie la clé primaire
    // dynamiquement (chaque table a son propre nom : id_region, id_pays, id_etat_candidat, etc.)
    res.json({ table: req.params.table, label: config.label, pk: config.pk, rows: result.rows });
  } catch (err) {
    console.error(`Erreur GET referentiels/${req.params.table} :`, err);
    res.status(500).json({ error: 'Erreur interne du serveur.' });
  }
});

/**
 * POST /api/admin/referentiels/:table
 *
 * Ajoute une nouvelle ligne dans la table sélectionnée.
 * Seuls les champs de la liste editableFields sont acceptés.
 *
 * Pour etat_candidat : interdit (les 11 états sont structurants pour toute la logique).
 */
router.post('/referentiels/:table', requireRole(['ADMIN']), async (req, res) => {
  const config = getTableConfig(req.params.table as string);
  if (!config) {
    res.status(400).json({ error: `Table '${req.params.table}' non autorisée.` });
    return;
  }

  // etat_candidat est en lecture seule (pas de création possible)
  if (config.restricted) {
    res.status(403).json({
      error: `L'ajout de lignes dans '${req.params.table}' est interdit — cette table est structurante pour la logique applicative.`,
    });
    return;
  }

  // Ne garder que les champs autorisés pour cette table (protection injection)
  const body = req.body as Record<string, unknown>;
  const allowedFields = config.editableFields.filter((f) => body[f] !== undefined);

  if (allowedFields.length === 0) {
    res.status(400).json({ error: 'Aucun champ valide fourni.' });
    return;
  }

  // Construction dynamique de la requête INSERT avec des placeholders numérotés ($1, $2, ...)
  const columns = allowedFields.join(', ');
  const placeholders = allowedFields.map((_, i) => `$${i + 1}`).join(', ');
  const values = allowedFields.map((f) => body[f]);

  try {
    const result = await pool.query(
      `INSERT INTO ${req.params.table} (${columns}) VALUES (${placeholders}) RETURNING *`,
      values
    );
    res.status(201).json(result.rows[0]);
  } catch (err: unknown) {
    console.error(`Erreur POST referentiels/${req.params.table} :`, err);
    // Gestion des violations de contrainte unique (crm_key déjà utilisée, etc.)
    if (err instanceof Error && 'code' in err && (err as NodeJS.ErrnoException).code === '23505') {
      res.status(409).json({ error: 'Un enregistrement avec ces données existe déjà (contrainte d\'unicité).' });
      return;
    }
    res.status(500).json({ error: 'Erreur interne du serveur.' });
  }
});

/**
 * PATCH /api/admin/referentiels/:table/:id
 *
 * Modifie une ligne existante.
 * Pour les tables en lecture seule (etat_candidat, etat_poste, etat_opportunite), interdit.
 *
 * CONVENTION de désactivation :
 *   On ne supprime JAMAIS physiquement un référentiel (il peut être référencé par
 *   clé étrangère depuis des candidats/postes existants). On passe active = false.
 */
router.patch('/referentiels/:table/:id', requireRole(['ADMIN']), async (req, res) => {
  const config = getTableConfig(req.params.table as string);
  if (!config) {
    res.status(400).json({ error: `Table '${req.params.table}' non autorisée.` });
    return;
  }

  if (config.restricted && config.restrictedFields!.length === 0) {
    res.status(403).json({
      error: `'${req.params.table}' est en lecture seule — aucune modification n'est possible depuis cet écran.`,
    });
    return;
  }

  const body = req.body as Record<string, unknown>;

  // Pour les tables restreintes (etat_candidat), filtrer sur restrictedFields uniquement
  const allowedFields = (config.restricted ? config.restrictedFields! : config.editableFields)
    .filter((f) => body[f] !== undefined);

  if (allowedFields.length === 0) {
    res.status(400).json({ error: 'Aucun champ modifiable fourni.' });
    return;
  }

  // Construction de la clause SET : "field1 = $1, field2 = $2, ..."
  const setClauses = allowedFields.map((f, i) => `${f} = $${i + 1}`).join(', ');
  const values = allowedFields.map((f) => body[f]);
  // L'identifiant de la ligne est passé en dernier paramètre
  values.push(req.params.id);

  try {
    // La règle « Administration de tutelle obligatoire pour un fonctionnaire » (candidat) repose sur la clé
    // FONCTIONNAIRE : la renommer la désactiverait en silence, donc cette clé est figée.
    if (req.params.table === 'statut_professionnel' && body.crm_key !== undefined) {
      const row = await pool.query('SELECT crm_key FROM statut_professionnel WHERE id_statut_professionnel=$1', [req.params.id]);
      if (row.rows[0]?.crm_key === 'FONCTIONNAIRE' && body.crm_key !== 'FONCTIONNAIRE') {
        res.status(409).json({ error: 'La clé FONCTIONNAIRE ne peut pas être modifiée : elle déclenche l’obligation de renseigner l’administration de tutelle.' });
        return;
      }
    }
    const result = await pool.query(
      `UPDATE ${req.params.table} SET ${setClauses} WHERE ${config.pk} = $${values.length} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Enregistrement non trouvé.' });
      return;
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(`Erreur PATCH referentiels/${req.params.table}/${req.params.id} :`, err);
    if (err instanceof Error && 'code' in err && (err as NodeJS.ErrnoException).code === '23505') {
      res.status(409).json({ error: 'Un enregistrement avec ces données existe déjà (contrainte d’unicité).' });
      return;
    }
    res.status(500).json({ error: 'Erreur interne du serveur.' });
  }
});

/**
 * GET /api/admin/referentiels-config
 *
 * Retourne la liste des tables administrables avec leurs labels lisibles.
 * Utilisé par le frontend pour peupler le menu déroulant "Choisir un référentiel".
 */
router.get('/referentiels-config', requireRole(['ADMIN']), (_req, res) => {
  const config = Object.entries(TABLES_CONFIG).map(([key, val]) => ({
    table: key,
    label: val.label,
    restricted: val.restricted ?? false,
    editableFields: val.restricted ? val.restrictedFields : val.editableFields,
  }));
  res.json(config);
});

export default router;
