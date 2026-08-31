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
import pool from '../db-pg';
import { requireRole } from '../middleware/requireRole';

const router = Router();

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
  notoriete_dcc:     { pk: 'id_notoriete_dcc',  label: 'Notoriété DCC',   editableFields: ['designation','active'] },
  etat_poste:        { pk: 'id_etat_poste',     label: 'États de poste',  editableFields: ['designation','active'] },
  etat_opportunite:  { pk: 'id_etat_opportunite',label: 'États d\'opportunité', editableFields: ['designation','active'] },
  niveau_langue:     { pk: 'id_niveau_langue',  label: 'Niveaux de langue',editableFields: ['designation','ordre'] },
  stages:            { pk: 'id_stages',         label: 'Sessions Choisir',editableFields: ['type_stage','date_debut','date_fin','active','voeux_definitif_ouvert'] },
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
