/**
 * services/emailChange.ts — Modification de l'adresse email d'un contact (UAT-02 D5, 07/10/2026)
 *
 * Règle unique pour les trois cas où l'adresse d'un contact change SANS passer par l'écran Admin :
 *   - état civil d'un candidat modifié par le recruteur ;
 *   - réimport d'un poste dont le CM (CM1 ou CM2) a une adresse corrigée ;
 *   - réimport d'un poste dont le CZ a une adresse corrigée.
 *
 * Étapes : (1) on contrôle que la nouvelle adresse n'existe dans aucun login ni dans aucun email de
 * contact rattaché à un compte (EmailConflictError sinon) ; (2) on met à jour le contact ET, s'il a
 * un compte, son login ; (3) on renvoie de quoi informer la personne par email (envoi à faire APRÈS
 * le COMMIT, avec sendEmailChangeNotices).
 *
 * L'écran Admin, lui, ne reporte PAS l'adresse sur le login (le login y est modifiable à part).
 */

import type { Pool, PoolClient } from 'pg';
import { assertEmailAvailable, normalizeEmail } from '../lib/emailRules';
import { applicationUrl, sendTemplatedEmail, smtpIsConfigured } from '../lib/emailTemplates';

type Db = Pick<Pool | PoolClient, 'query'>;

export type EmailChangeNotice = { email: string; prenom: string | null };

export type EmailChangeResult = { changed: boolean; loginChanged: boolean; notice: EmailChangeNotice | null };

/**
 * Applique la nouvelle adresse à un contact. À appeler dans une transaction.
 * `newEmail` vide : refusé si le contact a un compte (le login serait vide), sinon l'adresse est effacée.
 */
export async function changeContactEmail(client: PoolClient, idContact: number, newEmail: unknown): Promise<EmailChangeResult> {
  const email = normalizeEmail(newEmail);
  const found = await client.query(
    `SELECT c.email_contact,c.prenom_contact,u.id_user,u.login,u.active
       FROM contact c LEFT JOIN user_ u ON u.id_contact=c.id_contact
      WHERE c.id_contact=$1 FOR UPDATE OF c`,
    [idContact],
  );
  if (!found.rows.length) throw new Error('CONTACT_NOT_FOUND');
  const current = found.rows[0];
  const hasUser = current.id_user !== null && current.id_user !== undefined;

  if (!email) {
    if (hasUser) throw new Error('EMAIL_REQUIRED');
    await client.query('UPDATE contact SET email_contact=NULL WHERE id_contact=$1', [idContact]);
    return { changed: Boolean(current.email_contact), loginChanged: false, notice: null };
  }

  const emailSame = normalizeEmail(current.email_contact) === email;
  const loginSame = !hasUser || normalizeEmail(current.login) === email;
  if (emailSame && loginSame) {
    // Seule la casse ou des espaces peuvent différer : on range l'adresse en minuscules sans bruit.
    if (current.email_contact !== email) await client.query('UPDATE contact SET email_contact=$1 WHERE id_contact=$2', [email, idContact]);
    return { changed: false, loginChanged: false, notice: null };
  }

  await assertEmailAvailable(client, email, idContact);
  await client.query('UPDATE contact SET email_contact=$1 WHERE id_contact=$2', [email, idContact]);
  let loginChanged = false;
  if (hasUser && !loginSame) {
    await client.query('UPDATE user_ SET login=$1 WHERE id_user=$2', [email, current.id_user]);
    loginChanged = true;
  }
  // Pas d'email d'information pour un compte inactif (ex. CZ) : la personne n'a pas d'accès à rétablir.
  const notice = loginChanged && current.active !== false ? { email, prenom: current.prenom_contact ?? null } : null;
  return { changed: !emailSame, loginChanged, notice };
}

/** À appeler APRÈS le COMMIT. Ne lève jamais d'erreur (un échec d'envoi est seulement journalisé). */
export async function sendEmailChangeNotices(db: Db, notices: EmailChangeNotice[]): Promise<void> {
  if (!notices.length || !smtpIsConfigured()) return;
  for (const notice of notices) {
    try {
      await sendTemplatedEmail(db, 'CHANGEMENT_EMAIL', notice.email, {
        prenom: notice.prenom ?? '',
        identifiant: notice.email,
        lien: `${applicationUrl()}/login`,
      });
    } catch (error) {
      console.error('Email d’information de changement d’adresse non envoyé :', notice.email, error);
    }
  }
}
