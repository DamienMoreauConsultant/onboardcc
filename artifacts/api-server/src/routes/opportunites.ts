/**
 * routes/opportunites.ts — Routes de gestion des opportunités (matchings candidat-poste)
 *
 * Ce fichier sera développé en détail dans le prompt 4 (module Matching/Opportunités).
 * Pour l'instant, seuls des stubs fonctionnels sont fournis.
 *
 * Une opportunité est le lien entre une fiche de vœux (candidat) et une fiche de poste.
 * Elle porte les notes de matching (contexte, mission, warning) calculées par l'algorithme
 * de scoring (services/matching.ts, développé au prompt 4).
 */

import { Router } from 'express';
import { requireRole } from '../middleware/requireRole';
import pool from '../db-pg';

const router = Router();

/**
 * GET /api/opportunites
 * Liste les opportunités avec leur état, candidat et poste associés.
 */
router.get('/', requireRole(['REC', 'CM1', 'CM2', 'CHZ', 'ADMIN']), async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        o.id_opportunite,
        o.note_contexte,
        o.note_mission,
        o.note_warning,
        o.appreciation_recruteur,
        eo.designation AS etat_designation,
        co.nom_contact, co.prenom_contact,
        fp.ong, fp.fonction,
        p.designation AS pays_designation
      FROM opportunite o
      JOIN etat_opportunite eo ON eo.id_etat_opportunite = o.id_etat_opportunite
      JOIN fiche_de_voeux fdv  ON fdv.id_fiche_de_voeux = o.id_fiche_de_voeux
      JOIN candidat cand       ON cand.id_candidat = fdv.id_candidat
      JOIN contact co          ON co.id_contact = cand.id_contact
      JOIN fiche_de_poste fp   ON fp.id_poste = o.id_poste
      JOIN pays p              ON p.id_pays = fp.id_pays
      ORDER BY o.id_opportunite DESC
      LIMIT 100
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Erreur GET opportunites :', err);
    res.status(500).json({ error: 'Erreur interne du serveur.' });
  }
});

export default router;
