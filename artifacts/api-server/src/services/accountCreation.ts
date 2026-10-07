/**
 * services/accountCreation.ts — Création de compte user_ pour un contact déjà existant
 *
 * Factorise la création d'un compte applicatif (mot de passe temporaire haché en bcrypt, puis
 * invitation par email) pour les trois cas où un compte naît : import des postes (CM / CZ),
 * passage du candidat en AP2 (validation du 1er appel) et création par l'administrateur.
 *
 * Règles (recette DCC, 07/10/2026) :
 *   - l'identifiant de connexion est l'adresse email, enregistrée en minuscules ;
 *   - cette adresse ne doit exister dans aucun login ni dans aucun email de contact rattaché à un
 *     compte (voir lib/emailRules.ts) : sinon la création est refusée (EmailConflictError) ;
 *   - l'envoi du mail se fait APRÈS la validation de la transaction et ne fait jamais échouer
 *     l'opération : son résultat est simplement renvoyé pour être affiché.
 */

import bcrypt from 'bcryptjs';
import { randomBytes } from 'node:crypto';
import type { Pool, PoolClient } from 'pg';
import { assertEmailAvailable, normalizeEmail } from '../lib/emailRules';
import { sendTemplatedEmail, smtpIsConfigured, type EmailType } from '../lib/emailTemplates';

type Db = Pick<Pool | PoolClient, 'query'>;

export type NewAccountRole = 'CANDIDAT' | 'CM' | 'RECRUTEUR' | 'ADMIN';

/** 'candidat', 'cm', 'utilisateur' = modèle d'email à utiliser ; 'aucun' = pas d'email (compte CZ, inactif). */
export type NewAccountEmailMode = 'candidat' | 'cm' | 'utilisateur' | 'aucun';

const TEMPLATE_BY_MODE: Record<Exclude<NewAccountEmailMode, 'aucun'>, EmailType> = {
  candidat: 'INVITATION_CANDIDAT',
  cm: 'INVITATION_CM',
  utilisateur: 'INVITATION_UTILISATEUR',
};

export type CreateAccountForContactInput = {
  idContact: number;
  email: string;
  prenom: string | null;
  roleApplicatif: NewAccountRole;
  active: boolean;
  emailMode: NewAccountEmailMode;
};

export type PendingAccountInvitation = {
  /** Adresse du destinataire. */
  email: string;
  /** Identifiant de connexion communiqué à la personne. */
  identifiant: string;
  prenom: string | null;
  temporaryPassword: string;
  roleLabel: NewAccountRole;
  emailMode: NewAccountEmailMode;
};

/** Résultat d'un envoi d'invitations, tel qu'affiché à l'écran. */
export type InvitationStatus = 'not_required' | 'sent' | 'failed' | 'partial' | 'pending_smtp_configuration';
export type InvitationSummary = { status: InvitationStatus; sent: number; failed: number };

export function newTemporaryPassword(): string {
  return `Dcc-${randomBytes(12).toString('base64url')}`;
}

/**
 * Crée le compte du contact s'il n'en a pas déjà un (idempotent sur id_contact).
 * Ne déclenche aucun envoi d'email : à batcher après la transaction avec
 * sendPendingAccountInvitations, pour ne pas envoyer de mail sur une opération
 * ensuite annulée par un ROLLBACK. Lève EmailConflictError si l'adresse est déjà prise.
 */
export async function createAccountForContactIfMissing(
  client: PoolClient,
  input: CreateAccountForContactInput,
): Promise<PendingAccountInvitation | null> {
  const has = await client.query('SELECT 1 FROM user_ WHERE id_contact=$1', [input.idContact]);
  if (has.rows.length) return null;

  const email = normalizeEmail(input.email);
  await assertEmailAvailable(client, email, input.idContact);

  const temporaryPassword = newTemporaryPassword();
  await client.query(
    `INSERT INTO user_(login,password,id_contact,role_applicatif,active)
     VALUES($1,$2,$3,$4,$5)`,
    [email, await bcrypt.hash(temporaryPassword, 12), input.idContact, input.roleApplicatif, input.active],
  );

  return {
    email,
    identifiant: email,
    prenom: input.prenom,
    temporaryPassword,
    roleLabel: input.roleApplicatif,
    emailMode: input.emailMode,
  };
}

/** Envoie une invitation. Lève une erreur si l'envoi échoue (à capturer par l'appelant). */
export async function sendInvitation(db: Db, invitation: PendingAccountInvitation): Promise<void> {
  if (invitation.emailMode === 'aucun') return;
  await sendTemplatedEmail(db, TEMPLATE_BY_MODE[invitation.emailMode], invitation.email, {
    prenom: invitation.prenom ?? '',
    identifiant: invitation.identifiant,
    mot_de_passe: invitation.temporaryPassword,
    role: invitation.roleLabel,
  });
}

/**
 * À appeler APRÈS le COMMIT. Ne lève jamais d'erreur : une invitation qui échoue n'empêche pas les
 * autres, et n'annule jamais l'opération déjà validée. Le résumé permet d'informer l'utilisateur.
 */
export async function sendPendingAccountInvitations(db: Db, invitations: PendingAccountInvitation[]): Promise<InvitationSummary> {
  const toSend = invitations.filter((invitation) => invitation.emailMode !== 'aucun');
  if (!toSend.length) return { status: 'not_required', sent: 0, failed: 0 };
  if (!smtpIsConfigured()) return { status: 'pending_smtp_configuration', sent: 0, failed: toSend.length };

  let sent = 0;
  let failed = 0;
  for (const invitation of toSend) {
    try {
      await sendInvitation(db, invitation);
      sent += 1;
    } catch (error) {
      failed += 1;
      console.error('Compte créé mais invitation non envoyée :', invitation.email, error);
    }
  }
  return { status: failed === 0 ? 'sent' : sent === 0 ? 'failed' : 'partial', sent, failed };
}

/**
 * « Renvoyer l'invitation » : génère un nouveau mot de passe provisoire pour un compte existant et
 * renvoie les éléments à envoyer (sans l'envoyer). Renvoie null si le compte n'existe pas.
 */
export async function issueNewTemporaryPassword(db: Db, idUser: number): Promise<(PendingAccountInvitation & { active: boolean }) | null> {
  const found = await db.query(
    `SELECT u.id_user,u.login,u.active,u.role_applicatif,c.prenom_contact,c.email_contact
       FROM user_ u JOIN contact c ON c.id_contact=u.id_contact
      WHERE u.id_user=$1 FOR UPDATE OF u`,
    [idUser],
  );
  if (!found.rows.length) return null;
  const row = found.rows[0];
  const temporaryPassword = newTemporaryPassword();
  await db.query('UPDATE user_ SET password=$1,password_reset_nonce_hash=NULL,password_reset_requested_at=NULL WHERE id_user=$2', [await bcrypt.hash(temporaryPassword, 12), idUser]);
  const role = row.role_applicatif as NewAccountRole;
  return {
    email: normalizeEmail(row.email_contact) || row.login,
    identifiant: row.login,
    prenom: row.prenom_contact ?? null,
    temporaryPassword,
    roleLabel: role,
    emailMode: role === 'CANDIDAT' ? 'candidat' : role === 'CM' ? 'cm' : 'utilisateur',
    active: row.active !== false,
  };
}
