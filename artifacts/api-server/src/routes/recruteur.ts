import { Router } from 'express';
import pool from '../db-pg';
import { requireRole } from '../middleware/requireRole';

const router = Router();

router.get('/cockpit', requireRole(['REC']), async (_req, res): Promise<void> => {
  try {
    const result = await pool.query(
      `SELECT
         (SELECT COUNT(*)::int FROM candidat WHERE id_etat_candidat = 'ATA') AS candidats_en_ata,
         (SELECT COUNT(*)::int FROM candidat WHERE id_etat_candidat = 'ACC') AS candidats_acceptes,
         COALESCE((
           SELECT json_agg(alert_row ORDER BY alert_row.jours_ecoules DESC, alert_row.id_candidat DESC)
           FROM (
             SELECT c.id_candidat,
                    contact.prenom_contact AS prenom,
                    contact.nom_contact AS nom,
                    ec.designation AS etat,
                    e.date_evenement AS date_entree_etat,
                    ec.delais_de_reponse,
                    (CURRENT_DATE - e.date_evenement)::int AS jours_ecoules
             FROM candidat c
             JOIN contact ON contact.id_contact = c.id_contact
             JOIN etat_candidat ec ON ec.id_etat_candidat = c.id_etat_candidat
             JOIN LATERAL (
               SELECT date_evenement
               FROM etape
               WHERE id_candidat = c.id_candidat
                 AND id_etat_candidat = c.id_etat_candidat
               ORDER BY id_historique DESC
               LIMIT 1
             ) e ON true
             WHERE ec.delais_de_reponse IS NOT NULL
               AND CURRENT_DATE > e.date_evenement + ec.delais_de_reponse
           ) alert_row
         ), '[]'::json) AS alertes`,
    );
    const cockpit = result.rows[0];
    res.json({
      kpis: {
        candidats_en_ata: cockpit.candidats_en_ata,
        candidats_acceptes: cockpit.candidats_acceptes,
      },
      alertes: cockpit.alertes,
    });
  } catch (err) {
    res.status(500).json({ error: 'Impossible de charger le cockpit recruteur.' });
  }
});

export default router;