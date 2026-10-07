/**
 * routes/notifications.ts — Notifications des chargés de mission (UAT-06)
 *
 *   GET   /api/notifications               → (CM) ses 100 dernières notifications, 90 jours maximum
 *   PATCH /api/notifications/:id/consulter → (CM) marque la notification comme consultée, renvoie l'opportunité
 *   POST  /api/notifications/envoyer       → (tâche planifiée cPanel) envoie les emails groupés et purge
 *                                            Authentifié par l'en-tête « x-cron-token » = NOTIFICATION_CRON_TOKEN.
 */

import { Router } from 'express';
import { timingSafeEqual } from 'node:crypto';
import pool from '../db-pg';
import { requireRole } from '../middleware/requireRole';
import { EVENT_LABELS, RETENTION_DAYS, sendPendingNotifications, type NotificationEvent } from '../services/notificationsCm';

const router = Router();

router.get('/', requireRole(['CM']), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT n.id_notification,n.type_evenement,n.date_evenement,n.consulte,n.id_opportunite,
              fp.crm_key AS poste_crm_key,fp.fonction AS poste_fonction,
              co.prenom_contact AS candidat_prenom,co.nom_contact AS candidat_nom
         FROM notification_cm n
         JOIN opportunite o ON o.id_opportunite=n.id_opportunite
         JOIN fiche_de_poste fp ON fp.id_poste=o.id_poste
         JOIN fiche_de_voeux fdv ON fdv.id_fiche_de_voeux=o.id_fiche_de_voeux
         JOIN candidat cand ON cand.id_candidat=fdv.id_candidat
         JOIN contact co ON co.id_contact=cand.id_contact
        WHERE n.id_contact=$1 AND n.date_evenement >= now() - ($2::int * interval '1 day')
        ORDER BY n.date_evenement DESC,n.id_notification DESC
        LIMIT 100`,
      [req.user!.id_contact, RETENTION_DAYS],
    );
    res.json({
      non_consultees: result.rows.filter((row) => !row.consulte).length,
      notifications: result.rows.map((row) => ({ ...row, evenement: EVENT_LABELS[row.type_evenement as NotificationEvent] ?? row.type_evenement })),
    });
  } catch (error) {
    console.error('Erreur GET notifications :', error);
    res.status(500).json({ error: 'Impossible de charger les notifications.' });
  }
});

router.patch('/:id/consulter', requireRole(['CM']), async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) { res.status(400).json({ error: 'Identifiant invalide.' }); return; }
  try {
    const result = await pool.query(
      `UPDATE notification_cm SET consulte=true,date_consultation=COALESCE(date_consultation,now())
        WHERE id_notification=$1 AND id_contact=$2 RETURNING id_opportunite`,
      [id, req.user!.id_contact],
    );
    if (!result.rows.length) { res.status(404).json({ error: 'Notification introuvable.' }); return; }
    res.json({ id_opportunite: result.rows[0].id_opportunite });
  } catch (error) {
    console.error('Erreur consultation notification :', error);
    res.status(500).json({ error: 'Erreur interne du serveur.' });
  }
});

/** Compare deux textes en temps constant (le jeton ne doit pas pouvoir être deviné par mesure du temps de réponse). */
function sameToken(received: string, expected: string): boolean {
  const a = Buffer.from(received);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

router.post('/envoyer', async (req, res) => {
  const expected = process.env.NOTIFICATION_CRON_TOKEN;
  if (!expected || expected.length < 16) {
    res.status(503).json({ error: 'Envoi planifié non configuré : définir NOTIFICATION_CRON_TOKEN (16 caractères minimum).' });
    return;
  }
  const received = req.header('x-cron-token') ?? '';
  if (!received || !sameToken(received, expected)) {
    res.status(401).json({ error: 'Jeton invalide.' });
    return;
  }
  res.json(await sendPendingNotifications());
});

export default router;
