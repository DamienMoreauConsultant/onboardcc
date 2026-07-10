/**
 * routes/candidats.ts — Routes de gestion des candidats
 *
 * Ce fichier sera développé en détail dans le prompt 3 (module Candidat).
 * Pour l'instant, seuls des stubs sont fournis pour permettre à l'application
 * de démarrer sans erreur de routage.
 *
 * Architecture PATCH granulaire (conception.md §6.1.1) :
 *   L'édition se fait par onglet, pas par écran entier. Exemple :
 *   PATCH /api/candidats/:id/etat-civil  — ne touche que les colonnes de l'onglet État civil
 *   PATCH /api/candidats/:id/voeux       — ne touche que les colonnes fiche_de_voeux
 *   Cela évite d'écraser accidentellement des données d'un autre onglet.
 */

import { Router } from 'express';
import { requireRole } from '../middleware/requireRole';
import pool from '../db-pg';

const router = Router();

/**
 * GET /api/candidats
 * Liste tous les candidats (recruteurs et CM uniquement).
 * Développé en détail au prompt 3.
 */
router.get('/', requireRole(['REC', 'CM1', 'CM2', 'CHZ', 'ADMIN']), async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        c.id_candidat,
        c.trigram_candidat,
        co.nom_contact,
        co.prenom_contact,
        co.email_contact,
        ec.designation AS etat_designation,
        c.id_etat_candidat
      FROM candidat c
      JOIN contact co ON co.id_contact = c.id_contact
      JOIN etat_candidat ec ON ec.id_etat_candidat = c.id_etat_candidat
      ORDER BY co.nom_contact, co.prenom_contact
      LIMIT 100
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Erreur GET candidats :', err);
    res.status(500).json({ error: 'Erreur interne du serveur.' });
  }
});

/**
 * GET /api/candidats/:id
 * Détail complet d'un candidat.
 * Développé au prompt 3.
 */
router.get('/:id', requireRole(['REC', 'CM1', 'CM2', 'CHZ', 'ADMIN', 'CAN']), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.*, co.nom_contact, co.prenom_contact, co.email_contact, co.tel_contact,
              co.genre, co.date_naissance, co.nationalite,
              ec.designation AS etat_designation
       FROM candidat c
       JOIN contact co ON co.id_contact = c.id_contact
       JOIN etat_candidat ec ON ec.id_etat_candidat = c.id_etat_candidat
       WHERE c.id_candidat = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Candidat non trouvé.' });
      return;
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Erreur GET candidat :', err);
    res.status(500).json({ error: 'Erreur interne du serveur.' });
  }
});

export default router;
