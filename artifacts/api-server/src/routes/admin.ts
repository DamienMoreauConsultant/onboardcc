/**
 * routes/admin.ts — Module Admin : CRUD générique sur les tables référentielles
 *
 * Ce module expose trois routes paramétrées par nom de table :
 *   GET    /api/admin/referentiels/:table       → liste toutes les lignes
 *   POST   /api/admin/referentiels/:table       → ajoute une ligne
 *   PATCH  /api/admin/referentiels/:table/:id   → modifie une ligne
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
import { sendUserInvitation, smtpIsConfigured } from '../lib/candidateInvitations';

const router = Router();
const USER_ROLES = ['ADMIN', 'RECRUTEUR', 'CM'] as const;
type UserRole = typeof USER_ROLES[number];
const CONTACT_ROLES: Record<UserRole, readonly string[]> = {
  ADMIN: ['ADMIN'],
  RECRUTEUR: ['REC', 'CHZ'],
  CM: ['CM1', 'CM2'],
};

function validUserPayload(body: unknown): { value?: { nom: string; prenom: string; email: string; telephone: string; genre: string; role_applicatif: UserRole; role_contact: string }; error?: string } {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return { error: 'Corps de requête invalide.' };
  const data = body as Record<string, unknown>;
  const allowed = ['nom', 'prenom', 'email', 'telephone', 'genre', 'role_applicatif', 'role_contact'];
  if (Object.keys(data).some((key) => !allowed.includes(key))) return { error: 'Champ non autorisé.' };
  const read = (key: string, max: number) => typeof data[key] === 'string' && data[key].trim().length > 0 && data[key].trim().length <= max ? data[key].trim() : null;
  const nom = read('nom', 50), prenom = read('prenom', 50), email = read('email', 50);
  const telephone = read('telephone', 50), genre = read('genre', 20);
  if (!nom || !prenom || !email || !telephone || !genre) return { error: 'Nom, prénom, email, téléphone et genre sont obligatoires.' };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: 'Email invalide.' };
  if (!USER_ROLES.includes(data.role_applicatif as UserRole)) return { error: 'Rôle applicatif invalide.' };
  const role_applicatif = data.role_applicatif as UserRole;
  const role_contact = read('role_contact', 20);
  if (!role_contact || !CONTACT_ROLES[role_applicatif].includes(role_contact)) return { error: 'Rôle contact incompatible avec le rôle applicatif.' };
  return { value: { nom, prenom, email, telephone, genre, role_applicatif, role_contact } };
}

router.get('/utilisateurs', requireRole(['ADMIN']), async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id_user,u.login,u.active,u.role_applicatif,u.id_contact,
              c.nom_contact AS nom,c.prenom_contact AS prenom,c.email_contact AS email,
              c.tel_contact AS telephone,c.genre,c.role AS role_contact
       FROM user_ u JOIN contact c ON c.id_contact=u.id_contact
       ORDER BY c.nom_contact,c.prenom_contact,u.id_user`,
    );
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
  const temporaryPassword = randomBytes(18).toString('base64url');
  const contactCrmKey = `USR_${randomBytes(12).toString('hex').toUpperCase()}`;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const existing = await client.query(
      'SELECT 1 FROM contact c LEFT JOIN user_ u ON u.id_contact=c.id_contact WHERE lower(u.login)=lower($1) OR lower(c.email_contact)=lower($1) LIMIT 1',
      [data.email],
    );
    if (existing.rows.length) {
      await client.query('ROLLBACK');
      res.status(409).json({ error: 'Un compte utilise déjà cet email ou cet identifiant.' });
      return;
    }
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
    let invitation = 'pending_smtp_configuration';
    if (smtpIsConfigured()) {
      try {
        await sendUserInvitation({ email: data.email, prenom: data.prenom, temporaryPassword, roleLabel: data.role_applicatif });
        invitation = 'sent';
      } catch (emailError) {
        console.error('Compte créé mais invitation non envoyée :', emailError);
        invitation = 'failed';
      }
    }
    res.status(201).json({ ...user.rows[0], id_contact: contact.rows[0].id_contact, ...data, invitation });
  } catch (error: any) {
    try { await client.query('ROLLBACK'); } catch { /* transaction déjà validée */ }
    console.error('Erreur POST utilisateurs :', error);
    if (error?.code === '23505') { res.status(409).json({ error: 'Un compte ou contact avec ces données existe déjà.' }); return; }
    res.status(500).json({ error: 'Erreur interne du serveur.' });
  } finally { client.release(); }
});

async function setUserActive(req: any, res: any, active: boolean): Promise<void> {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) { res.status(400).json({ error: 'Identifiant utilisateur invalide.' }); return; }
  try {
    const result = await pool.query('UPDATE user_ SET active=$1 WHERE id_user=$2 RETURNING id_user,active', [active, id]);
    if (!result.rows.length) { res.status(404).json({ error: 'Utilisateur non trouvé.' }); return; }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erreur changement état utilisateur :', error);
    res.status(500).json({ error: 'Erreur interne du serveur.' });
  }
}
router.patch('/utilisateurs/:id/desactiver', requireRole(['ADMIN']), async (req, res) => setUserActive(req, res, false));
router.patch('/utilisateurs/:id/reactiver', requireRole(['ADMIN']), async (req, res) => setUserActive(req, res, true));

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
  type_billet_avion: { pk: 'id_type_billet_avion', label: 'Type de billet d’avion', editableFields: ['crm_key','designation','active'] },
  etat_poste:        { pk: 'id_etat_poste',     label: 'États de poste',  editableFields: ['designation','active'] },
  etat_opportunite:  { pk: 'id_etat_opportunite',label: 'États d\'opportunité', editableFields: ['designation','active'] },
  niveau_langue:     { pk: 'id_niveau_langue',  label: 'Niveaux de langue',editableFields: ['crm_key','designation','ordre','active'] },
  stages:            { pk: 'id_stages',         label: 'Sessions Choisir',editableFields: ['type_stage','date_debut','date_fin','active','voeux_definitif_ouvert'] },
  aide_contextuelle: { pk: 'id_aide_contextuelle', label: 'Aides contextuelles', editableFields: ['cle_champ','texte','active'] },
  // etat_candidat : LECTURE + modification limitée seulement (pas d'ajout ni de suppression)
  etat_candidat:     {
    pk: 'id_etat_candidat',
    label: 'États candidat',
    editableFields: ['designation','delais_de_reponse'],
    restricted: true,
    restrictedFields: ['designation','delais_de_reponse'],
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
 * Pour etat_candidat, seuls designation et delais_de_reponse sont modifiables.
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
