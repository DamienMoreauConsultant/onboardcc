/**
 * services/notificationsCm.ts — Notifications des chargés de mission (UAT-06, 07/10/2026)
 *
 * Un événement sur une opportunité (proposition au CM, mise en lien, accord du candidat, affectation…)
 * crée UNE ligne notification_cm pour chaque CM du poste (CM1 ou CM2 avec un compte actif), sauf pour
 * l'auteur de l'action. Le CM les consulte dans un tableau en bas de son accueil ; un seul email générique,
 * sans donnée personnelle, le prévient qu'il a du nouveau (règle RGPD du projet).
 *
 * Fréquence d'envoi : lue dans le modèle d'email NOTIFICATION_CM (Admin > Modèle d'email) :
 *   0  = envoi immédiat à chaque événement (aucune tâche planifiée nécessaire) ;
 *   >0 = mail groupé, au plus un toutes les X heures par CM, déclenché par la tâche planifiée cPanel qui
 *        appelle POST /api/notifications/envoyer (voir routes/notifications.ts).
 * Les notifications de plus de 90 jours sont supprimées à chaque passage du traitement d'envoi.
 */

import type { PoolClient } from 'pg';
import pool from '../db-pg';
import { loadTemplate, sendTemplatedEmail, smtpIsConfigured } from '../lib/emailTemplates';

export type NotificationEvent =
  | 'PROPOSEE_CM'
  | 'MISE_EN_LIEN'
  | 'ACCORD_PRINCIPE'
  | 'ACCORD_DEFINITIF'
  | 'REFUS_CANDIDAT_MEL'
  | 'REFUS_CANDIDAT_ACP'
  | 'AFFECTATION'
  | 'REFUS_PARTENAIRE'
  | 'ANNULATION_AFFECTATION';

export const EVENT_LABELS: Record<NotificationEvent, string> = {
  PROPOSEE_CM: 'Opportunité proposée — à traiter',
  MISE_EN_LIEN: 'Mise en lien du candidat avec le poste',
  ACCORD_PRINCIPE: 'Le candidat a donné son accord de principe',
  ACCORD_DEFINITIF: 'Le candidat a accepté la mission',
  REFUS_CANDIDAT_MEL: 'Le candidat a refusé la mission (après la mise en lien)',
  REFUS_CANDIDAT_ACP: 'Le candidat a refusé la mission (après son accord de principe)',
  AFFECTATION: 'Le candidat est affecté sur le poste',
  REFUS_PARTENAIRE: 'Le partenaire a refusé le candidat',
  ANNULATION_AFFECTATION: 'L’affectation a été annulée',
};

export const RETENTION_DAYS = 90;

/** Événement à notifier pour une action sur une opportunité, ou null si l'action ne concerne pas le CM. */
export function eventForAction(action: string, stateBefore: string): NotificationEvent | null {
  switch (action) {
    case 'proposer_cm': return 'PROPOSEE_CM';
    case 'mettre_en_lien': return 'MISE_EN_LIEN';
    case 'accord_de_principe': return 'ACCORD_PRINCIPE';
    case 'accord_definitif': return 'ACCORD_DEFINITIF';
    case 'refuser_candidat': return stateBefore === 'Accord de principe' ? 'REFUS_CANDIDAT_ACP' : 'REFUS_CANDIDAT_MEL';
    case 'decision_dcc': return 'AFFECTATION';
    case 'refuser_partenaire': return 'REFUS_PARTENAIRE';
    case 'annuler_affectation': return 'ANNULATION_AFFECTATION';
    default: return null;
  }
}

/**
 * Crée les notifications dans la transaction de l'action. Renvoie les contacts CM concernés
 * (pour l'envoi immédiat éventuel, à faire APRÈS le COMMIT).
 */
export async function createCmNotifications(client: PoolClient, idOpportunite: number, event: NotificationEvent, actorIdContact: number): Promise<number[]> {
  const result = await client.query(
    `INSERT INTO notification_cm(id_contact,id_opportunite,type_evenement)
     SELECT DISTINCT c.id_contact,o.id_opportunite,$2
       FROM opportunite o
       JOIN gere_poste gp ON gp.id_poste=o.id_poste
       JOIN contact c ON c.id_contact=gp.id_contact AND c.role IN ('CM1','CM2')
       JOIN user_ u ON u.id_contact=c.id_contact AND u.active AND u.role_applicatif='CM'
      WHERE o.id_opportunite=$1 AND c.id_contact<>$3
     RETURNING id_contact`,
    [idOpportunite, event, actorIdContact],
  );
  return result.rows.map((row) => row.id_contact as number);
}

export type SendSummary = { envoyes: number; reportes: number; echecs: number; purges: number; raison?: 'smtp_non_configure' };

/**
 * Envoie, à chaque CM qui a des notifications non encore signalées, UN email générique.
 * `contactIds` limite l'envoi à ces CM (envoi immédiat après un événement) ; `ignorerFrequence` force l'envoi.
 * Ne lève jamais d'erreur : un échec d'envoi remet simplement les notifications « à envoyer ».
 */
export async function sendPendingNotifications(options: { contactIds?: number[]; ignorerFrequence?: boolean } = {}): Promise<SendSummary> {
  const summary: SendSummary = { envoyes: 0, reportes: 0, echecs: 0, purges: 0 };
  try {
    const purge = await pool.query(`DELETE FROM notification_cm WHERE date_evenement < now() - ($1::int * interval '1 day')`, [RETENTION_DAYS]);
    summary.purges = purge.rowCount ?? 0;
    if (!smtpIsConfigured()) return { ...summary, raison: 'smtp_non_configure' };

    const template = await loadTemplate(pool, 'NOTIFICATION_CM');
    const pending = await pool.query(
      `SELECT n.id_contact,c.prenom_contact,c.email_contact,
              (SELECT max(x.date_envoi_mail) FROM notification_cm x WHERE x.id_contact=n.id_contact) AS dernier_envoi,
              EXTRACT(EPOCH FROM (now() - (SELECT max(x.date_envoi_mail) FROM notification_cm x WHERE x.id_contact=n.id_contact)))/3600 AS heures_depuis_dernier
         FROM notification_cm n
         JOIN contact c ON c.id_contact=n.id_contact
         JOIN user_ u ON u.id_contact=c.id_contact AND u.active
        WHERE n.date_envoi_mail IS NULL AND ($1::int[] IS NULL OR n.id_contact=ANY($1::int[]))
        GROUP BY n.id_contact,c.prenom_contact,c.email_contact`,
      [options.contactIds?.length ? options.contactIds : null],
    );

    for (const row of pending.rows) {
      const attente = template.frequence_heures > 0 && !options.ignorerFrequence
        && row.heures_depuis_dernier !== null && Number(row.heures_depuis_dernier) < template.frequence_heures;
      if (attente || !row.email_contact) { summary.reportes += 1; continue; }

      // On « réserve » les lignes avant l'envoi : deux passages simultanés ne préviennent pas deux fois le CM.
      const claimed = await pool.query('UPDATE notification_cm SET date_envoi_mail=now() WHERE id_contact=$1 AND date_envoi_mail IS NULL RETURNING id_notification', [row.id_contact]);
      if (!claimed.rows.length) continue;
      const ids = claimed.rows.map((r) => r.id_notification as number);
      try {
        await sendTemplatedEmail(pool, 'NOTIFICATION_CM', row.email_contact, { prenom: row.prenom_contact ?? '', nombre: ids.length });
        summary.envoyes += 1;
      } catch (error) {
        summary.echecs += 1;
        console.error('Email de notification non envoyé au CM :', row.id_contact, error);
        await pool.query('UPDATE notification_cm SET date_envoi_mail=NULL WHERE id_notification=ANY($1::int[])', [ids]);
      }
    }
  } catch (error) {
    console.error('Traitement des notifications CM en erreur :', error);
  }
  return summary;
}

/** Après un événement : si le modèle est réglé sur « immédiat » (0 heure), prévient aussitôt les CM concernés. */
export async function flushInstantNotifications(contactIds: number[]): Promise<void> {
  if (!contactIds.length) return;
  try {
    const template = await loadTemplate(pool, 'NOTIFICATION_CM');
    if (template.frequence_heures === 0) await sendPendingNotifications({ contactIds });
  } catch (error) {
    console.error('Envoi immédiat des notifications CM impossible :', error);
  }
}
