/**
 * routes/postes.ts — Routes de gestion des fiches de poste
 *
 * Ce fichier sera développé en détail dans le prompt 2 (module Poste).
 * Pour l'instant, seuls des stubs fonctionnels sont fournis.
 *
 * Accès RBAC :
 *   - Recruteurs (REC) : liste, détail, création, modification de tous les postes.
 *   - CM (CM1/CM2/CHZ) : lecture uniquement des postes qu'ils gèrent.
 *   - Candidats (CAN)  : pas d'accès direct aux postes (via opportunités uniquement).
 */

import { Router } from 'express';
import { requireRole } from '../middleware/requireRole';
import pool from '../db-pg';

const router = Router();

/**
 * GET /api/postes
 * Liste tous les postes avec leur état et pays.
 * Développé au prompt 2.
 */
router.get('/', requireRole(['REC', 'CM1', 'CM2', 'CHZ', 'ADMIN']), async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        fp.id_poste,
        fp.crm_key,
        fp.ong,
        fp.fonction,
        fp.date_arrivee_souhaitee,
        fp.priorite,
        ep.designation AS etat_designation,
        p.designation  AS pays_designation,
        d.designation  AS domaine_designation
      FROM fiche_de_poste fp
      JOIN etat_poste ep ON ep.id_etat_poste = fp.id_etat_poste
      JOIN pays p        ON p.id_pays = fp.id_pays
      JOIN domaine d     ON d.id_domaine = fp.id_domaine
      ORDER BY fp.date_arrivee_souhaitee DESC
      LIMIT 100
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Erreur GET postes :', err);
    res.status(500).json({ error: 'Erreur interne du serveur.' });
  }
});

/**
 * GET /api/postes/:id
 * Détail complet d'un poste.
 */
router.get('/:id', requireRole(['REC', 'CM1', 'CM2', 'CHZ', 'ADMIN']), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT fp.*, ep.designation AS etat_designation, p.designation AS pays_designation,
              d.designation AS domaine_designation, h.designation AS hebergement_designation,
              dur.periode AS duree_designation
       FROM fiche_de_poste fp
       JOIN etat_poste ep ON ep.id_etat_poste = fp.id_etat_poste
       JOIN pays p        ON p.id_pays = fp.id_pays
       JOIN domaine d     ON d.id_domaine = fp.id_domaine
       JOIN hebergement h ON h.id_hebergement = fp.id_hebergement
       JOIN duree dur     ON dur.id_duree = fp.id_duree
       WHERE fp.id_poste = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Poste non trouvé.' });
      return;
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Erreur GET poste :', err);
    res.status(500).json({ error: 'Erreur interne du serveur.' });
  }
});

export default router;
