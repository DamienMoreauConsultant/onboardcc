import { Router } from 'express';
import pool from '../db-pg';
import { requireRole } from '../middleware/requireRole';

const router = Router();

router.get('/cockpit', requireRole(['RECRUTEUR']), async (_req, res): Promise<void> => {
  try {
    const result = await pool.query(
      `SELECT
         (SELECT COUNT(*)::int FROM candidat c
          JOIN fiche_de_voeux f ON f.id_candidat=c.id_candidat
          WHERE c.id_etat_candidat='AP2'
            AND (COALESCE(f.flag_fiche_de_voeux_soumise,false) OR f.date_voeux_provisoires IS NOT NULL)
         ) AS candidats_a_inviter_session_choisir,
         (SELECT COUNT(DISTINCT cand.id_candidat)::int
          FROM opportunite o
          JOIN etat_opportunite eo ON eo.id_etat_opportunite=o.id_etat_opportunite
          JOIN fiche_de_voeux fdv ON fdv.id_fiche_de_voeux=o.id_fiche_de_voeux
          JOIN candidat cand ON cand.id_candidat=fdv.id_candidat
          WHERE eo.designation='Non qualifié'
            AND NOT COALESCE(o.flag_opportunite_obsolete,false)
         ) AS candidats_a_qualifier,
         (SELECT COUNT(DISTINCT cand.id_candidat)::int
          FROM opportunite o
          JOIN etat_opportunite eo ON eo.id_etat_opportunite=o.id_etat_opportunite
          JOIN fiche_de_voeux fdv ON fdv.id_fiche_de_voeux=o.id_fiche_de_voeux
          JOIN candidat cand ON cand.id_candidat=fdv.id_candidat
          WHERE eo.designation='Approuvé CM'
            AND NOT COALESCE(fdv.flag_candidat_deja_mis_en_lien,false)
         ) AS candidats_a_mettre_en_lien,
         (SELECT COUNT(DISTINCT cand.id_candidat)::int
          FROM opportunite o
          JOIN etat_opportunite eo ON eo.id_etat_opportunite=o.id_etat_opportunite
          JOIN fiche_de_voeux fdv ON fdv.id_fiche_de_voeux=o.id_fiche_de_voeux
          JOIN candidat cand ON cand.id_candidat=fdv.id_candidat
          WHERE eo.designation='Accepté'
         ) AS candidats_a_affecter,
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
        candidats_a_inviter_session_choisir: cockpit.candidats_a_inviter_session_choisir,
        candidats_a_qualifier: cockpit.candidats_a_qualifier,
        candidats_a_mettre_en_lien: cockpit.candidats_a_mettre_en_lien,
        candidats_a_affecter: cockpit.candidats_a_affecter,
      },
      alertes: cockpit.alertes,
    });
  } catch (err) {
    res.status(500).json({ error: 'Impossible de charger le cockpit recruteur.' });
  }
});

export default router;