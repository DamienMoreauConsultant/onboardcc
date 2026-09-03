/**
 * routes/postes.ts — Gestion des fiches de poste (Prompt 2)
 *
 * Import CSV en 2 temps (verifier → executer), liste filtrée par rôle,
 * détail complet, et actions FERMER / RÉOUVRIR.
 *
 * Accès RBAC :
 *   - REC / ADMIN : liste complète, import, fermer, réouvrir
 *   - CHZ : liste restreinte (gere_poste uniquement), mais droits d'action recruteur
 *   - CM1 / CM2 : liste restreinte (gere_poste uniquement), détail lecture seule
 *
 * Ordre des routes : les routes statiques (/import/template, /etats)
 * sont déclarées AVANT la route dynamique /:id pour éviter les conflits.
 */

import { Router } from 'express';
import multer from 'multer';
import Papa from 'papaparse';
import { requireRole } from '../middleware/requireRole';
import pool from '../db-pg';
import { parseFrenchDate } from '../lib/frenchDate';
import { Opportunite } from '../services/matching';
import {
  linkPosteContact,
  type PosteContactRole,
  upsertPosteContact,
} from '../services/posteContactUpsert';

const router = Router();

/**
 * Multer — stockage en mémoire vive.
 * Le buffer est accessible via req.file.buffer ; aucun fichier n'est écrit sur disque.
 */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 Mo max
});
const actionUpload = multer({
  storage: multer.memoryStorage(),
  limits: { files: 2, fileSize: 10 * 1024 * 1024 },
});

/**
 * Colonnes du template CSV — ordre contractuel (conception.md §6.2.2).
 * Modifier cet ordre = modifier le contrat d'échange avec le CRM externe.
 */
const CSV_COLUMNS = [
  'ref_poste', 'date_demarrage', 'date_demande', 'priorite', 'statut_volontaire',
  'partenaire_ong', 'candidat_preaffecte', 'nom_candidat_preaffecte', 'fonction',
  'pays', 'hebergement', 'langue_requise', 'niveau_langue_requis', 'duree_mission',
  'domaine', 'competences_recherchees', 'environnement', 'zone_orange',
  'conditions_spartiates', 'hopital_proche', 'billet_avion',
  'indemnite_mensuelle_partenaire', 'indemnite_mensuelle_dcc', 'gite_et_couvert',
  'detail_hebergement', 'preference_genre', 'deuxieme_poste_partenaire',
  'deuxieme_poste_alentour', 'nouveau_poste', 'nom_ancien_volontaire', 'odd_lie',
  'contexte_mission', 'objectifs_mission', 'taches', 'detail_competences',
  'dimension_ecclesiale',
  'cm1_crmkey', 'cm1_nom', 'cm1_prenom',
  'cm2_crmkey', 'cm2_nom', 'cm2_prenom',
  'cz_crmkey', 'cz_nom', 'cz_prenom',
  'mis_crmkey', 'mis_nom', 'mis_prenom', 'mis_telephone', 'mis_email',
  'mis_adresse1', 'mis_adresse2', 'mis_code_postal', 'mis_ville', 'mis_pays',
  'par_crmkey', 'par_nom', 'par_prenom', 'par_telephone', 'par_email',
  'par_adresse1', 'par_adresse2', 'par_code_postal', 'par_ville', 'par_pays',
  'date_maj_crm',
];

/**
 * Données de référence chargées en mémoire avant toute validation CSV.
 * Contient les maps crm_key → id pour chaque table de référence.
 */
type RefData = {
  pays: Record<string, number>;
  hebergement: Record<string, number>;
  duree: Record<string, number>;
  domaine: Record<string, number>;
  competences: Record<string, number>;
  environnement: Record<string, number>;
  langue: Record<string, number>;
  niveauLangue: Record<string, number>;
  billetAvion: Record<string, number>;
};

/**
 * Charge tous les référentiels en une seule passe parallèle.
 * Évite les N+1 queries pendant la validation ligne par ligne.
 */
async function loadRefData(): Promise<RefData> {
  const [pays, hebergement, duree, domaine, competences, environnement, langue, niveauLangue, billetAvion] =
    await Promise.all([
      pool.query('SELECT crm_key, id_pays        AS id FROM pays'),
      pool.query('SELECT crm_key, id_hebergement AS id FROM hebergement'),
      pool.query('SELECT crm_key, id_duree       AS id FROM duree'),
      pool.query('SELECT crm_key, id_domaine     AS id FROM domaine'),
      pool.query('SELECT crm_key, id_competences AS id FROM competences'),
      pool.query('SELECT crm_key, id_environnement AS id FROM environnement'),
      pool.query('SELECT crm_key, id_langue      AS id FROM langue'),
      pool.query('SELECT crm_key, id_niveau_langue AS id FROM niveau_langue WHERE COALESCE(active,true)'),
      pool.query('SELECT crm_key, id_type_billet_avion AS id FROM type_billet_avion WHERE COALESCE(active,true)'),
    ]);

  const toMap = (rows: Array<{ crm_key: string; id: number }>) =>
    Object.fromEntries(rows.map((r) => [r.crm_key, r.id]));

  return {
    pays: toMap(pays.rows),
    hebergement: toMap(hebergement.rows),
    duree: toMap(duree.rows),
    domaine: toMap(domaine.rows),
    competences: toMap(competences.rows),
    environnement: toMap(environnement.rows),
    langue: toMap(langue.rows),
    niveauLangue: toMap(niveauLangue.rows),
    billetAvion: toMap(billetAvion.rows),
  };
}

/** Interprète une valeur CSV comme booléen (TRUE/FALSE/OUI/NON/1/0). */
function parseBool(val: string | undefined | null): boolean {
  if (!val) return false;
  return ['true', 'yes', 'oui', '1'].includes(val.toLowerCase().trim());
}

/** Interprète une valeur CSV comme entier nullable. */
function parseIntOrNull(val: string | undefined | null): number | null {
  if (!val?.trim()) return null;
  const n = parseInt(val.trim(), 10);
  return isNaN(n) ? null : n;
}

/**
 * Convertit une date du contrat CRM (JJ/MM/AAAA) vers le format ISO attendu
 * par PostgreSQL. La vérification calendaire empêche les dates comme
 * 31/02/2027 d'être acceptées silencieusement.
 */

/**
 * Valide une seule ligne CSV.
 * Vérifie les champs obligatoires, les clés référentielles et les règles conditionnelles.
 * Retourne un objet { ligne, statut, message } — aucune écriture en base.
 */
function validateRow(
  row: Record<string, string>,
  lineNum: number,
  refs: RefData,
): { ligne: number; statut: 'ok' | 'erreur'; message: string } {
  const errors: string[] = [];

  // Champs obligatoires (Mandatory dans le contrat d'échange)
  const mandatoryFields = [
    'ref_poste', 'date_demarrage', 'statut_volontaire', 'partenaire_ong',
    'candidat_preaffecte', 'fonction', 'pays', 'hebergement', 'duree_mission', 'domaine',
  ];
  for (const col of mandatoryFields) {
    if (!row[col]?.trim()) {
      errors.push(`Champ obligatoire manquant : ${col}`);
    }
  }

  // Les dates du fichier CRM sont en JJ/MM/AAAA ; date_maj_crm reste
  // optionnelle mais doit respecter le même contrat lorsqu'elle est fournie.
  for (const col of ['date_demarrage', 'date_demande', 'date_maj_crm']) {
    const parsedDate = parseFrenchDate(row[col]);
    if (!parsedDate.valid) {
      errors.push(`Date invalide ligne ${lineNum} : ${col}="${row[col]?.trim() ?? ''}" — format attendu JJ/MM/AAAA`);
    }
  }

  // Résolution des clés référentielles — seulement si le champ est renseigné
  if (row.pays?.trim() && !refs.pays[row.pays.trim()])
    errors.push(`Pays inconnu : crm_key=${row.pays.trim()} — créez-le d'abord`);
  if (row.hebergement?.trim() && !refs.hebergement[row.hebergement.trim()])
    errors.push(`Hébergement inconnu : crm_key=${row.hebergement.trim()} — créez-le d'abord`);
  if (row.duree_mission?.trim() && !refs.duree[row.duree_mission.trim()])
    errors.push(`Durée inconnue : crm_key=${row.duree_mission.trim()} — créez-le d'abord`);
  if (row.domaine?.trim() && !refs.domaine[row.domaine.trim()])
    errors.push(`Domaine inconnu : crm_key=${row.domaine.trim()} — créez-le d'abord`);
  const hasRequiredLanguage = Boolean(row.langue_requise?.trim());
  const hasRequiredLanguageLevel = Boolean(row.niveau_langue_requis?.trim());
  if (hasRequiredLanguage !== hasRequiredLanguageLevel)
    errors.push('langue_requise et niveau_langue_requis doivent être renseignés ensemble');
  if (hasRequiredLanguage && !refs.langue[row.langue_requise.trim()])
    errors.push(`Langue inconnue : crm_key=${row.langue_requise.trim()} — créez-le d'abord`);
  if (hasRequiredLanguageLevel && !refs.niveauLangue[row.niveau_langue_requis.trim()])
    errors.push(`Niveau de langue inconnu : crm_key=${row.niveau_langue_requis.trim()} — créez-le d'abord`);
  if (row.billet_avion?.trim() && !refs.billetAvion[row.billet_avion.trim()])
    errors.push(`Type de billet d'avion inconnu : crm_key=${row.billet_avion.trim()} — créez-le d'abord`);

  // Listes multi-valeurs séparées par ';'
  for (const key of (row.competences_recherchees ?? '').split(';').map((s) => s.trim()).filter(Boolean)) {
    if (!refs.competences[key])
      errors.push(`Compétence inconnue : crm_key=${key} — créez-la d'abord`);
  }
  for (const key of (row.environnement ?? '').split(';').map((s) => s.trim()).filter(Boolean)) {
    if (!refs.environnement[key])
      errors.push(`Environnement inconnu : crm_key=${key} — créez-le d'abord`);
  }

  const contactGroups = [
    { prefix: 'cm1', withAddress: false },
    { prefix: 'cm2', withAddress: false },
    { prefix: 'cz', withAddress: false },
    { prefix: 'mis', withAddress: true },
    { prefix: 'par', withAddress: true },
  ];
  for (const group of contactGroups) {
    const crmKeyColumn = `${group.prefix}_crmkey`;
    if (row[crmKeyColumn]?.trim()) {
      for (const required of ['nom', 'prenom']) {
        const column = `${group.prefix}_${required}`;
        if (!row[column]?.trim()) errors.push(`${column} obligatoire si ${crmKeyColumn} renseigné`);
      }
      if (group.withAddress && row[`${group.prefix}_adresse1`]?.trim() && !row[`${group.prefix}_pays`]?.trim()) {
        errors.push(`${group.prefix}_pays obligatoire si ${group.prefix}_adresse1 renseigné`);
      }
    }
    if (group.withAddress) {
      const country = row[`${group.prefix}_pays`]?.trim();
      if (country && !refs.pays[country]) {
        errors.push(`Pays inconnu : crm_key=${country} pour ${group.prefix}_pays`);
      }
    }
  }

  // Règle conditionnelle : nom_candidat_preaffecte requis si candidat_preaffecte = TRUE
  if (parseBool(row.candidat_preaffecte) && !row.nom_candidat_preaffecte?.trim())
    errors.push('nom_candidat_preaffecte est requis lorsque candidat_preaffecte = TRUE');

  if (errors.length > 0) {
    return { ligne: lineNum, statut: 'erreur', message: errors.join(' | ') };
  }
  return { ligne: lineNum, statut: 'ok', message: '✓' };
}

/** Vérifie que la ligne contient exactement le contrat CSV attendu. */
function validateHeaders(fields: string[] | undefined): string | null {
  const actual = (fields ?? []).map((field) => field.trim());
  const missing = CSV_COLUMNS.filter((column) => !actual.includes(column));
  const unexpected = actual.filter((column) => !CSV_COLUMNS.includes(column));
  if (missing.length || unexpected.length) {
    const details = [
      missing.length ? `colonnes manquantes : ${missing.join(', ')}` : '',
      unexpected.length ? `colonnes inconnues : ${unexpected.join(', ')}` : '',
    ].filter(Boolean).join(' ; ');
    return `En-tête CSV invalide (${details}). Le template comporte exactement ${CSV_COLUMNS.length} colonnes.`;
  }
  return null;
}

/** Créée à la demande car le schéma initial ne fournit pas d'historique de poste. */
async function ensurePosteHistory(client: { query: Function }) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS historique_poste (
      id_historique SERIAL PRIMARY KEY,
      id_poste INTEGER NOT NULL REFERENCES fiche_de_poste(id_poste) ON DELETE CASCADE,
      id_contact INTEGER REFERENCES contact(id_contact),
      action VARCHAR(20) NOT NULL,
      commentaire TEXT NOT NULL,
      pieces_jointes JSONB NOT NULL DEFAULT '[]'::jsonb,
      date_evenement TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

/** Un CHZ conserve les actions recruteur, mais uniquement sur les postes qu'il gère. */
async function chzCanAccessPoste(role: string, idContact: number, idPoste: number): Promise<boolean> {
  if (role !== 'CHZ') return true;
  const access = await pool.query(
    'SELECT 1 FROM gere_poste WHERE id_poste=$1 AND id_contact=$2',
    [idPoste, idContact],
  );
  return access.rows.length > 0;
}

type PosteFilterSpec = { expression: string; joins: string; conditionSql: string };
const POSTE_FILTERS: Record<string, PosteFilterSpec> = {
  etat: {
    expression: 'ep.designation',
    joins: 'JOIN etat_poste ep ON ep.id_etat_poste=fp.id_etat_poste',
    conditionSql: 'ep.designation = ANY($VALUE::text[])',
  },
  pays: {
    expression: 'p.designation',
    joins: 'JOIN pays p ON p.id_pays=fp.id_pays',
    conditionSql: 'p.designation = ANY($VALUE::text[])',
  },
  type: {
    expression: 'fp.statut_volontaire',
    joins: '',
    conditionSql: 'fp.statut_volontaire = ANY($VALUE::text[])',
  },
  fonction: {
    expression: 'fp.fonction',
    joins: '',
    conditionSql: 'fp.fonction = ANY($VALUE::text[])',
  },
};
function parsePosteFilters(value: unknown): Record<string, string[]> {
  if (typeof value !== 'string' || !value.trim()) return {};
  try {
    const parsed = JSON.parse(value) as Record<string, unknown>;
    return Object.fromEntries(Object.entries(parsed)
      .filter(([key, values]) => key in POSTE_FILTERS && Array.isArray(values))
      .map(([key, values]) => [key, (values as unknown[]).filter((item): item is string => typeof item === 'string' && item.trim().length > 0)]));
  } catch {
    return {};
  }
}
function posteFilterSql(filters: Record<string, string[]>, startIndex: number) {
  const params: string[][] = [];
  const clauses: string[] = [];
  let index = startIndex;
  for (const [key, values] of Object.entries(filters)) {
    if (!values.length) continue;
    clauses.push(POSTE_FILTERS[key].conditionSql.replace('$VALUE', `$${index}`));
    params.push(values);
    index += 1;
  }
  return { sql: clauses.length ? ` AND ${clauses.join(' AND ')}` : '', params };
}

/* ─────────────────────────────────────────────────────────────────────
   GET /api/postes/import/template
   Retourne un fichier CSV vide avec les 66 colonnes en en-tête.
───────────────────────────────────────────────────────────────────── */
router.get(
  '/import/template',
  requireRole(['REC', 'CHZ', 'ADMIN']),
  (_req, res) => {
    const csv = CSV_COLUMNS.join(',') + '\n';
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="template_postes_dcc.csv"');
    res.send(csv);
  },
);

/* ─────────────────────────────────────────────────────────────────────
   GET /api/postes/etats
   Liste tous les états de poste (pour peupler les filtres front).
───────────────────────────────────────────────────────────────────── */
router.get(
  '/etats',
  requireRole(['REC', 'CM1', 'CM2', 'CHZ', 'ADMIN']),
  async (_req, res) => {
    try {
      const result = await pool.query(
        'SELECT id_etat_poste, designation FROM etat_poste ORDER BY id_etat_poste',
      );
      res.json(result.rows);
    } catch (err) {
      console.error('Erreur GET /postes/etats :', err);
      res.status(500).json({ error: 'Erreur interne du serveur.' });
    }
  },
);

router.get(
  '/filtres/:colonne',
  requireRole(['REC', 'CM1', 'CM2', 'CHZ', 'ADMIN']),
  async (req, res) => {
    const filter = POSTE_FILTERS[String(req.params.colonne)];
    if (!filter) {
      res.status(400).json({ error: 'Colonne de filtre non autorisée.' });
      return;
    }
    try {
      const user = req.user!;
      const isCm = ['CM1', 'CM2', 'CHZ'].includes(user.role);
      const result = await pool.query(
        `SELECT DISTINCT ${filter.expression} AS value
         FROM fiche_de_poste fp
         ${filter.joins}
         ${isCm ? 'JOIN gere_poste gp ON gp.id_poste=fp.id_poste AND gp.id_contact=$1' : ''}
         WHERE ${filter.expression} IS NOT NULL AND BTRIM(${filter.expression}) <> ''
         ORDER BY value`,
        isCm ? [user.id_contact] : [],
      );
      res.json({ values: result.rows.map((row) => row.value) });
    } catch (err) {
      console.error('Erreur GET filtres postes :', err);
      res.status(500).json({ error: 'Erreur interne du serveur.' });
    }
  },
);

/* ─────────────────────────────────────────────────────────────────────
   POST /api/postes/import/verifier  (multipart/form-data, champ "file")
   Étape 1 — Parse + validation sans aucune écriture en base.
   Retourne : { lignes: Array<{ ligne, statut, message }> }
───────────────────────────────────────────────────────────────────── */
router.post(
  '/import/verifier',
  requireRole(['REC', 'CHZ', 'ADMIN']),
  upload.single('file'),
  async (req, res) => {
    if (!req.file) {
      res.status(400).json({ error: 'Aucun fichier reçu.' });
      return;
    }
    try {
      const csvText = req.file.buffer.toString('utf-8');
      const parsed = Papa.parse<Record<string, string>>(csvText, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (h) => h.trim(),
      });

      const headerError = validateHeaders(parsed.meta.fields);
      if (headerError) {
        res.status(400).json({ error: headerError });
        return;
      }
      if (parsed.errors.length > 0) {
        res.status(400).json({ error: `Erreur de parsing CSV : ${parsed.errors[0].message}` });
        return;
      }

      const refs = await loadRefData();
      const lignes = parsed.data.map((row, i) => validateRow(row, i + 2, refs));
      res.json({ lignes });
    } catch (err) {
      console.error('Erreur /postes/import/verifier :', err);
      res.status(500).json({ error: 'Erreur interne du serveur.' });
    }
  },
);

/* ─────────────────────────────────────────────────────────────────────
   POST /api/postes/import/executer  (multipart/form-data, champ "file")
   Étape 2 — Exécution en transaction globale "tout ou rien".
   Appelé uniquement si 0 ligne en erreur (vérifié également côté back).
───────────────────────────────────────────────────────────────────── */
router.post(
  '/import/executer',
  requireRole(['REC', 'CHZ', 'ADMIN']),
  upload.single('file'),
  async (req, res) => {
    if (!req.file) {
      res.status(400).json({ error: 'Aucun fichier reçu.' });
      return;
    }

    const client = await pool.connect();
    try {
      const csvText = req.file.buffer.toString('utf-8');
      const parsed = Papa.parse<Record<string, string>>(csvText, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (h) => h.trim(),
      });

      const headerError = validateHeaders(parsed.meta.fields);
      if (headerError) {
        res.status(400).json({ error: headerError });
        return;
      }
      if (parsed.errors.length > 0) {
        res.status(400).json({ error: `Erreur de parsing CSV : ${parsed.errors[0].message}` });
        return;
      }

      const refs = await loadRefData();

      // Défense en profondeur : on revalide avant d'écrire, même si le front a déjà validé
      const erreurs = parsed.data
        .map((row, i) => validateRow(row, i + 2, refs))
        .filter((r) => r.statut === 'erreur');

      if (erreurs.length > 0) {
        res.status(422).json({
          error: 'Des erreurs de validation ont été détectées — import annulé.',
          lignes_en_erreur: erreurs,
        });
        return;
      }

      await client.query('BEGIN');
      const postesAffectes: number[] = [];

      for (const row of parsed.data) {
        const isPreaffecte = parseBool(row.candidat_preaffecte);
        // La validation ci-dessus garantit que ces conversions sont valides.
        // On réutilise toutefois la même fonction au moment de l'écriture :
        // PostgreSQL ne reçoit ainsi jamais une date française brute.
        const dateDemande = parseFrenchDate(row.date_demande);
        const dateDemarrage = parseFrenchDate(row.date_demarrage);
        const dateMajCrm = parseFrenchDate(row.date_maj_crm);

        /**
         * État initial du poste à l'import (conception.md §2.2.2) :
         *   - candidat_preaffecte = false → "À pourvoir" (id=1), circuit de matching activé
         *   - candidat_preaffecte = true  → "Pré-affecté" (id=2), bypass du matching
         */
        const idEtatPoste = isPreaffecte ? 5 : 1;
        const flagCreateOpportunity = !isPreaffecte;

        const idPays       = refs.pays[row.pays.trim()];
        const idHebergement = refs.hebergement[row.hebergement.trim()];
        const idDuree      = refs.duree[row.duree_mission.trim()];
        const idDomaine    = refs.domaine[row.domaine.trim()];

        /**
         * UPSERT sur crm_key (clé d'échange avec le CRM).
         * - Nouveau poste (crm_key inconnu)  → INSERT, flag_create_opportunity = true si non pré-affecté
         * - Poste existant (crm_key connu)   → UPDATE non comparatif (tous les champs écrasés),
         *                                       sans déclencher ici la logique de scoring
         */
        const upsert = await client.query(
          `INSERT INTO fiche_de_poste (
             crm_key, id_etat_poste, statut_volontaire, ong, candidat_preaffecte,
             nom_candidat, fonction, date_demande, date_arrivee_souhaitee, priorite,
             id_type_billet_avion, indemnite_mensuelle_partenaire, indemnite_mensuelle_dcc,
             gite_et_couvert, hebergement_detail, preference_genre,
             deuxieme_poste_possible_partenaire, deuxieme_poste_possible_alentour,
             nouveau_poste, nom_ancien_volontaire, odd_lie,
             contexte_mission, objectifs_mission, taches, competences_detail,
             dimension_ecclesial, date_maj_crm, flag_zone_orange, flag_condition_spartiates,
             flag_hopital_proche, flag_create_opportunity,
             id_pays, id_hebergement, id_duree, id_domaine
           ) VALUES (
             $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,
             $11,$12,$13,$14,$15,$16,$17,$18,$19,$20,
             $21,$22,$23,$24,$25,$26,$27,$28,$29,$30,
             $31,$32,$33,$34,$35
           )
           ON CONFLICT (crm_key) DO UPDATE SET
             statut_volontaire                 = EXCLUDED.statut_volontaire,
             ong                               = EXCLUDED.ong,
             candidat_preaffecte               = EXCLUDED.candidat_preaffecte,
             nom_candidat                      = EXCLUDED.nom_candidat,
             fonction                          = EXCLUDED.fonction,
             date_demande                      = EXCLUDED.date_demande,
             date_arrivee_souhaitee            = EXCLUDED.date_arrivee_souhaitee,
             priorite                          = EXCLUDED.priorite,
             id_type_billet_avion              = EXCLUDED.id_type_billet_avion,
             indemnite_mensuelle_partenaire     = EXCLUDED.indemnite_mensuelle_partenaire,
             indemnite_mensuelle_dcc            = EXCLUDED.indemnite_mensuelle_dcc,
             gite_et_couvert                   = EXCLUDED.gite_et_couvert,
             hebergement_detail                = EXCLUDED.hebergement_detail,
             preference_genre                  = EXCLUDED.preference_genre,
             deuxieme_poste_possible_partenaire = EXCLUDED.deuxieme_poste_possible_partenaire,
             deuxieme_poste_possible_alentour  = EXCLUDED.deuxieme_poste_possible_alentour,
             nouveau_poste                     = EXCLUDED.nouveau_poste,
             nom_ancien_volontaire             = EXCLUDED.nom_ancien_volontaire,
             odd_lie                           = EXCLUDED.odd_lie,
             contexte_mission                  = EXCLUDED.contexte_mission,
             objectifs_mission                 = EXCLUDED.objectifs_mission,
             taches                            = EXCLUDED.taches,
             competences_detail                = EXCLUDED.competences_detail,
             dimension_ecclesial               = EXCLUDED.dimension_ecclesial,
              date_maj_crm                      = EXCLUDED.date_maj_crm,
             flag_zone_orange                  = EXCLUDED.flag_zone_orange,
             flag_condition_spartiates         = EXCLUDED.flag_condition_spartiates,
             flag_hopital_proche               = EXCLUDED.flag_hopital_proche,
              id_etat_poste                     = EXCLUDED.id_etat_poste,
             id_pays                           = EXCLUDED.id_pays,
             id_hebergement                    = EXCLUDED.id_hebergement,
             id_duree                          = EXCLUDED.id_duree,
             id_domaine                        = EXCLUDED.id_domaine
           RETURNING id_poste`,
          [
            row.ref_poste.trim(),
            idEtatPoste,
            row.statut_volontaire?.trim()           || null,
            row.partenaire_ong?.trim()              || null,
            isPreaffecte,
            row.nom_candidat_preaffecte?.trim()     || null,
            row.fonction?.trim()                    || null,
            dateDemande.iso,
            dateDemarrage.iso,
            row.priorite?.trim()                    || null,
            row.billet_avion?.trim() ? refs.billetAvion[row.billet_avion.trim()] : null,
            parseIntOrNull(row.indemnite_mensuelle_partenaire),
            parseIntOrNull(row.indemnite_mensuelle_dcc),
            row.gite_et_couvert?.trim()             || null,
            row.detail_hebergement?.trim()          || null,
            row.preference_genre?.trim()            || null,
            parseBool(row.deuxieme_poste_partenaire),
            parseBool(row.deuxieme_poste_alentour),
            parseBool(row.nouveau_poste),
            row.nom_ancien_volontaire?.trim()       || null,
            row.odd_lie?.trim()                     || null,
            row.contexte_mission?.trim()            || null,
            row.objectifs_mission?.trim()           || null,
            row.taches?.trim()                      || null,
            row.detail_competences?.trim()          || null,
            row.dimension_ecclesiale?.trim()        || null,
            dateMajCrm.iso,
            parseBool(row.zone_orange),
            parseBool(row.conditions_spartiates),
            parseBool(row.hopital_proche),
            flagCreateOpportunity,
            idPays,
            idHebergement,
            idDuree,
            idDomaine,
          ],
        );

        const idPoste = upsert.rows[0].id_poste as number;
        postesAffectes.push(idPoste);

        /**
         * Mise à jour des tables associées — non comparative :
         * on supprime tout puis on réinsère depuis le CSV.
         * Garantit la cohérence sans diffing complexe.
         */
        await Promise.all([
          client.query('DELETE FROM langue_poste WHERE id_poste = $1', [idPoste]),
          client.query('DELETE FROM evolue_dans  WHERE id_poste = $1', [idPoste]),
          client.query('DELETE FROM recherche    WHERE id_poste = $1', [idPoste]),
          client.query('DELETE FROM gere_poste   WHERE id_poste = $1', [idPoste]),
        ]);

        // Langue (0 ou 1 par poste — clé primaire sur id_poste)
        if (row.langue_requise?.trim() && refs.langue[row.langue_requise.trim()]) {
          await client.query(
            'INSERT INTO langue_poste (id_poste, id_langue, id_niveau_langue) VALUES ($1,$2,$3)',
            [idPoste, refs.langue[row.langue_requise.trim()], row.niveau_langue_requis?.trim() ? refs.niveauLangue[row.niveau_langue_requis.trim()] : null],
          );
        }

        // Environnements (liste ';')
        for (const key of (row.environnement ?? '').split(';').map((s) => s.trim()).filter(Boolean)) {
          if (refs.environnement[key]) {
            await client.query(
              'INSERT INTO evolue_dans (id_poste, id_environnement) VALUES ($1,$2)',
              [idPoste, refs.environnement[key]],
            );
          }
        }

        // Compétences recherchées (liste ';')
        for (const key of (row.competences_recherchees ?? '').split(';').map((s) => s.trim()).filter(Boolean)) {
          if (refs.competences[key]) {
            await client.query(
              'INSERT INTO recherche (id_poste, id_competences) VALUES ($1,$2)',
              [idPoste, refs.competences[key]],
            );
          }
        }

        // Le CRM est également maître des cinq contacts liés au poste. Un même
        // crm_key conserve toujours le même id_contact, même sur plusieurs postes.
        const contactGroups: Array<{ prefix: string; role: PosteContactRole; withDetails: boolean }> = [
          { prefix: 'cm1', role: 'CM1', withDetails: false },
          { prefix: 'cm2', role: 'CM2', withDetails: false },
          { prefix: 'cz', role: 'CHZ', withDetails: false },
          { prefix: 'mis', role: 'MIS', withDetails: true },
          { prefix: 'par', role: 'PAR', withDetails: true },
        ];
        for (const group of contactGroups) {
          const crmKey = row[`${group.prefix}_crmkey`]?.trim();
          if (!crmKey) continue;
          const address1 = group.withDetails ? row[`${group.prefix}_adresse1`]?.trim() : '';
          const countryKey = group.withDetails ? row[`${group.prefix}_pays`]?.trim() : '';
          const contact = await upsertPosteContact(client, {
            crmKey,
            nom: row[`${group.prefix}_nom`].trim(),
            prenom: row[`${group.prefix}_prenom`].trim(),
            role: group.role,
            telephone: group.withDetails ? row[`${group.prefix}_telephone`]?.trim() || null : null,
            email: group.withDetails ? row[`${group.prefix}_email`]?.trim() || null : null,
            adresse: address1
              ? {
                  adresse1: address1,
                  adresse2: row[`${group.prefix}_adresse2`]?.trim() || null,
                  codePostal: row[`${group.prefix}_code_postal`]?.trim() || null,
                  ville: row[`${group.prefix}_ville`]?.trim() || null,
                  idPays: refs.pays[countryKey],
                }
              : null,
          });
          await linkPosteContact(client, idPoste, contact.idContact);
        }
      }

      for (const idPoste of [...new Set(postesAffectes)]) {
        await Opportunite.synchroniserPoste(idPoste, client);
      }
      await client.query('COMMIT');

      console.log(`[import] Terminé — ${postesAffectes.length} poste(s) traité(s) : ids=${postesAffectes.join(',')}`);

      res.json({
        message: `Import réussi. ${parsed.data.length} poste(s) traité(s).`,
        nb_postes: parsed.data.length,
        ids_postes: postesAffectes,
      });
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Erreur /postes/import/executer — ROLLBACK complet :', err);
      res.status(500).json({ error: 'Erreur interne — rollback complet effectué. Aucune donnée modifiée.' });
    } finally {
      client.release();
    }
  },
);

/* ─────────────────────────────────────────────────────────────────────
   GET /api/postes
   Liste les postes avec compteurs d'opportunités.
     - REC / ADMIN : tous les postes
     - CM1 / CM2 / CHZ : uniquement les postes gérés (gere_poste)
   Query param : ?etats=À+pourvoir,Pré-affecté,...
   Par défaut : tous les états sauf "Fermé"
───────────────────────────────────────────────────────────────────── */
router.get(
  '/',
  requireRole(['REC', 'CM1', 'CM2', 'CHZ', 'ADMIN']),
  async (req, res) => {
    try {
      const user = req.user!;
      const isCm = ['CM1', 'CM2', 'CHZ'].includes(user.role);

      const filters = parsePosteFilters(req.query.filtres);
      const etatsParam = req.query.etats as string | undefined;
      const legacyStates: string[] = etatsParam
        ? etatsParam.split(',').map((s) => s.trim()).filter(Boolean)
        : [];
      const etatsFilter = filters.etat?.length ? filters.etat : legacyStates;
      const cmParamIndex = isCm ? 2 : null;
      const generatedFilters = posteFilterSql(filters, isCm ? 3 : 2);

      /**
       * Pour les CM, on restreint aux postes où leur id_contact apparaît dans gere_poste.
       * On utilise un INNER JOIN conditionnel (présent uniquement pour les CM).
       */
      const sql = `
        SELECT
          fp.id_poste,
          fp.crm_key,
          fp.statut_volontaire,
          fp.fonction,
           fp.flag_poste_deja_mis_en_lien,
          ep.designation                                                       AS etat_designation,
          p.designation                                                        AS pays_designation,
          COUNT(CASE WHEN eo.id_etat_opportunite IN (2, 4) THEN 1 END)::int  AS opp_a_qualifier,
          COUNT(CASE WHEN eo.id_etat_opportunite = 5 THEN 1 END)::int        AS opp_approuvee,
          COUNT(CASE WHEN eo.id_etat_opportunite IN (6,7,8,9) THEN 1 END)::int AS opp_en_affectation
        FROM fiche_de_poste fp
        JOIN etat_poste ep ON ep.id_etat_poste = fp.id_etat_poste
        JOIN pays p        ON p.id_pays        = fp.id_pays
        ${isCm ? `JOIN gere_poste gp ON gp.id_poste = fp.id_poste AND gp.id_contact = $${cmParamIndex}` : ''}
        LEFT JOIN opportunite o        ON o.id_poste               = fp.id_poste
        LEFT JOIN etat_opportunite eo  ON eo.id_etat_opportunite   = o.id_etat_opportunite
        WHERE ((cardinality($1::text[]) = 0 AND ep.designation <> 'Fermé') OR ep.designation = ANY($1::text[]))
        ${generatedFilters.sql}
        GROUP BY fp.id_poste, fp.crm_key, fp.statut_volontaire, fp.fonction, fp.flag_poste_deja_mis_en_lien,
                 ep.designation, p.designation
        ORDER BY fp.id_poste DESC
      `;

      const params = isCm
        ? [etatsFilter, user.id_contact, ...generatedFilters.params]
        : [etatsFilter, ...generatedFilters.params];
      const result = await pool.query(sql, params);
      res.json(result.rows);
    } catch (err) {
      console.error('Erreur GET /postes :', err);
      res.status(500).json({ error: 'Erreur interne du serveur.' });
    }
  },
);

/* ─────────────────────────────────────────────────────────────────────
   GET /api/postes/:id
   Détail complet d'un poste (lecture seule).
   CM : vérifie que son id_contact est dans gere_poste avant de répondre.
───────────────────────────────────────────────────────────────────── */
router.get(
  '/:id',
  requireRole(['REC', 'CM1', 'CM2', 'CHZ', 'ADMIN']),
  async (req, res) => {
    const idPoste = parseInt(req.params.id as string, 10);
    if (isNaN(idPoste)) {
      res.status(400).json({ error: 'id_poste invalide.' });
      return;
    }
    try {
      const user = req.user!;

      const result = await pool.query(
        `SELECT
           fp.*,
           ep.designation   AS etat_designation,
           p.designation    AS pays_designation,
           tba.designation  AS billet_avion_designation,
           h.designation    AS hebergement_designation,
           dur.periode      AS duree_designation,
           d.designation    AS domaine_designation,
           l.crm_key        AS langue_crm_key,
           l.designation    AS langue_designation,
           nl.designation   AS langue_niveau_requis,
           -- Compétences recherchées (tableau JSON)
           (SELECT json_agg(json_build_object('crm_key', c.crm_key, 'designation', c.designation))
            FROM recherche r JOIN competences c ON c.id_competences = r.id_competences
            WHERE r.id_poste = fp.id_poste)           AS competences_json,
           -- Environnements (tableau JSON)
           (SELECT json_agg(json_build_object('crm_key', e.crm_key, 'designation', e.designation))
            FROM evolue_dans ed JOIN environnement e ON e.id_environnement = ed.id_environnement
            WHERE ed.id_poste = fp.id_poste)           AS environnements_json,
            -- Contacts gestionnaires : CM1, CM2, CHZ, MIS, PAR (tableau JSON)
           (SELECT json_agg(json_build_object(
                    'id_contact', c.id_contact, 'crm_key', c.crm_key,
                     'nom', c.nom_contact, 'prenom', c.prenom_contact, 'role', c.role,
                     'telephone', c.tel_contact, 'email', c.email_contact,
                     'adresse1', a.adresse1, 'adresse2', a.adresse2,
                     'code_postal', a.code_postal, 'ville', a.ville))
            FROM gere_poste gp JOIN contact c ON c.id_contact = gp.id_contact
                  LEFT JOIN adresse a ON a.id_adresse = c.id_adresse
            WHERE gp.id_poste = fp.id_poste)           AS contacts_json,
           (SELECT json_agg(json_build_object(
                    'action', hp.action, 'commentaire', hp.commentaire,
                    'pieces_jointes', hp.pieces_jointes, 'date_evenement', hp.date_evenement)
                    ORDER BY hp.date_evenement DESC)
            FROM historique_poste hp WHERE hp.id_poste = fp.id_poste) AS historique_json
         FROM fiche_de_poste fp
         JOIN etat_poste ep  ON ep.id_etat_poste   = fp.id_etat_poste
         JOIN pays p         ON p.id_pays           = fp.id_pays
         JOIN hebergement h  ON h.id_hebergement    = fp.id_hebergement
         JOIN duree dur      ON dur.id_duree         = fp.id_duree
         JOIN domaine d      ON d.id_domaine         = fp.id_domaine
         LEFT JOIN type_billet_avion tba ON tba.id_type_billet_avion = fp.id_type_billet_avion
         LEFT JOIN langue_poste lp ON lp.id_poste   = fp.id_poste
         LEFT JOIN langue l        ON l.id_langue    = lp.id_langue
         LEFT JOIN niveau_langue nl ON nl.id_niveau_langue = lp.id_niveau_langue
         WHERE fp.id_poste = $1`,
        [idPoste],
      );

      if (result.rows.length === 0) {
        res.status(404).json({ error: 'Poste non trouvé.' });
        return;
      }

      // Vérification d'accès pour les CM : doivent apparaître dans gere_poste
      const isCm = ['CM1', 'CM2', 'CHZ'].includes(user.role);
      if (isCm) {
        const contacts = result.rows[0].contacts_json as Array<{ id_contact: number }> | null;
        if (!contacts?.some((c) => c.id_contact === user.id_contact)) {
          res.status(403).json({ error: 'Accès refusé : vous ne gérez pas ce poste.' });
          return;
        }
      }

      res.json(result.rows[0]);
    } catch (err) {
      console.error('Erreur GET /postes/:id :', err);
      res.status(500).json({ error: 'Erreur interne du serveur.' });
    }
  },
);

/* ─────────────────────────────────────────────────────────────────────
   PATCH /api/postes/:id/fermer
   Ferme le poste — etat_poste → "Fermé" (id=6)
   Autorisé uniquement si état ∈ {À pourvoir, Pré-affecté, Pré-réservé, Réservé}
   Accès : REC / ADMIN uniquement
───────────────────────────────────────────────────────────────────── */
router.patch(
  '/:id/fermer',
  requireRole(['REC', 'CHZ', 'ADMIN']),
  actionUpload.array('pieces_jointes', 2),
  async (req, res) => {
    const idPoste = parseInt(req.params.id as string, 10);
    if (isNaN(idPoste)) { res.status(400).json({ error: 'id_poste invalide.' }); return; }

    try {
      if (!await chzCanAccessPoste(req.user!.role, req.user!.id_contact, idPoste)) {
        res.status(403).json({ error: 'Accès refusé : vous ne gérez pas ce poste.' });
        return;
      }
      const current = await pool.query(
        `SELECT ep.designation FROM fiche_de_poste fp
         JOIN etat_poste ep ON ep.id_etat_poste = fp.id_etat_poste
         WHERE fp.id_poste = $1`,
        [idPoste],
      );
      if (current.rows.length === 0) { res.status(404).json({ error: 'Poste non trouvé.' }); return; }

      const ETATS_FERMABLES = ['À pourvoir', 'Pré-affecté', 'Pré-réservé', 'Réservé'];
      if (!ETATS_FERMABLES.includes(current.rows[0].designation)) {
        res.status(409).json({
          error: `Impossible de fermer un poste en état "${current.rows[0].designation}".`,
        });
        return;
      }

      const commentaire = String(req.body?.commentaire ?? '').trim();
      if (!commentaire) {
        res.status(400).json({ error: 'Le commentaire de fermeture est obligatoire.' });
        return;
      }
      const pieces = (req.files as Express.Multer.File[] | undefined) ?? [];
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await ensurePosteHistory(client);
        await client.query('UPDATE fiche_de_poste SET id_etat_poste = 6 WHERE id_poste = $1', [idPoste]);
        await Opportunite.marquerObsoletesPourPoste(idPoste, client);
        await client.query(
          `INSERT INTO historique_poste (id_poste, id_contact, action, commentaire, pieces_jointes)
           VALUES ($1, $2, 'FERMETURE', $3, $4::jsonb)`,
          [idPoste, req.user!.id_contact, commentaire, JSON.stringify(pieces.map((p) => ({ nom: p.originalname, type: p.mimetype, taille: p.size })))],
        );
        await client.query('COMMIT');
        res.json({ message: 'Poste fermé.', id_poste: idPoste, etat: 'Fermé' });
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (err) {
      console.error('Erreur PATCH /postes/:id/fermer :', err);
      res.status(500).json({ error: 'Erreur interne du serveur.' });
    }
  },
);

/* ─────────────────────────────────────────────────────────────────────
   PATCH /api/postes/:id/reouvrir
   Réouvre le poste — etat_poste → "À pourvoir" (id=1)
   Autorisé uniquement si état ∈ {Pré-affecté, Fermé}
   Accès : REC / ADMIN uniquement
───────────────────────────────────────────────────────────────────── */
router.patch(
  '/:id/reouvrir',
  requireRole(['REC', 'CHZ', 'ADMIN']),
  actionUpload.array('pieces_jointes', 2),
  async (req, res) => {
    const idPoste = parseInt(req.params.id as string, 10);
    if (isNaN(idPoste)) { res.status(400).json({ error: 'id_poste invalide.' }); return; }

    try {
      if (!await chzCanAccessPoste(req.user!.role, req.user!.id_contact, idPoste)) {
        res.status(403).json({ error: 'Accès refusé : vous ne gérez pas ce poste.' });
        return;
      }
      const current = await pool.query(
        `SELECT ep.designation FROM fiche_de_poste fp
         JOIN etat_poste ep ON ep.id_etat_poste = fp.id_etat_poste
         WHERE fp.id_poste = $1`,
        [idPoste],
      );
      if (current.rows.length === 0) { res.status(404).json({ error: 'Poste non trouvé.' }); return; }

      const ETATS_REOUVRABLE = ['Pré-affecté', 'Fermé'];
      if (!ETATS_REOUVRABLE.includes(current.rows[0].designation)) {
        res.status(409).json({
          error: `Impossible de réouvrir un poste en état "${current.rows[0].designation}".`,
        });
        return;
      }

      const commentaire = String(req.body?.commentaire ?? '').trim();
      if (!commentaire) {
        res.status(400).json({ error: 'Le commentaire de réouverture est obligatoire.' });
        return;
      }
      const pieces = (req.files as Express.Multer.File[] | undefined) ?? [];
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await ensurePosteHistory(client);
        await client.query('UPDATE fiche_de_poste SET id_etat_poste = 1,flag_create_opportunity=true WHERE id_poste = $1', [idPoste]);
        await Opportunite.synchroniserPoste(idPoste, client);
        await client.query(
          `INSERT INTO historique_poste (id_poste, id_contact, action, commentaire, pieces_jointes)
           VALUES ($1, $2, 'REOUVERTURE', $3, $4::jsonb)`,
          [idPoste, req.user!.id_contact, commentaire, JSON.stringify(pieces.map((p) => ({ nom: p.originalname, type: p.mimetype, taille: p.size })))],
        );
        await client.query('COMMIT');
        res.json({ message: 'Poste réouvert.', id_poste: idPoste, etat: 'À pourvoir' });
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (err) {
      console.error('Erreur PATCH /postes/:id/reouvrir :', err);
      res.status(500).json({ error: 'Erreur interne du serveur.' });
    }
  },
);

export default router;
