/**
 * services/accountCreation.ts — Création de compte user_ pour un contact déjà existant
 *
 * Factorise le bloc dupliqué entre l'import candidats et l'import postes : les deux
 * créent un compte applicatif pour un contact qui n'en a pas encore, avec un mot de
 * passe temporaire haché (bcrypt), puis une invitation par email. Seuls le rôle
 * applicatif, l'état actif/inactif et le modèle d'email envoyé diffèrent selon
 * l'appelant (conception.md — chantier CM/CHZ à l'import des postes, 18/09/2026).
 */

import bcrypt from 'bcryptjs';
import { randomBytes } from 'node:crypto';
import type { PoolClient } from 'pg';
import {
  sendCandidateInvitations,
  sendUserInvitation,
  smtpIsConfigured,
  type CandidateInvitation,
} from '../lib/candidateInvitations';

export type NewAccountRole = 'CANDIDAT' | 'CM' | 'RECRUTEUR' | 'ADMIN';

/** 'candidat' = email spécifique espace candidat ; 'generique' = email générique DCC ; 'aucun' = pas d'email. */
export type NewAccountEmailMode = 'candidat' | 'generique' | 'aucun';

export type CreateAccountForContactInput = {
  idContact: number;
  email: string;
  prenom: string | null;
  roleApplicatif: NewAccountRole;
  active: boolean;
  emailMode: NewAccountEmailMode;
};

export type PendingAccountInvitation = CandidateInvitation & {
  roleLabel: NewAccountRole;
  emailMode: NewAccountEmailMode;
};

/**
 * Crée le compte du contact s'il n'en a pas déjà un (idempotent sur id_contact).
 * Ne déclenche aucun envoi d'email : à batcher après la transaction avec
 * sendPendingAccountInvitations, pour ne pas envoyer de mail sur une opération
 * ensuite annulée par un ROLLBACK.
 */
export async function createAccountForContactIfMissing(
  client: PoolClient,
  input: CreateAccountForContactInput,
): Promise<PendingAccountInvitation | null> {
  const has = await client.query('SELECT 1 FROM user_ WHERE id_contact=$1', [input.idContact]);
  if (has.rows.length) return null;

  const temporaryPassword = `Dcc-${randomBytes(12).toString('base64url')}`;
  await client.query(
    `INSERT INTO user_(login,password,id_contact,role_applicatif,active)
     VALUES($1,$2,$3,$4,$5)`,
    [input.email.trim(), await bcrypt.hash(temporaryPassword, 12), input.idContact, input.roleApplicatif, input.active],
  );

  return {
    email: input.email.trim(),
    prenom: input.prenom,
    temporaryPassword,
    roleLabel: input.roleApplicatif,
    emailMode: input.emailMode,
  };
}

/** À appeler après COMMIT. Une invitation individuelle qui échoue n'empêche pas les autres. */
export async function sendPendingAccountInvitations(invitations: PendingAccountInvitation[]): Promise<void> {
  if (!invitations.length || !smtpIsConfigured()) return;

  const candidateInvitations = invitations.filter((i) => i.emailMode === 'candidat');
  if (candidateInvitations.length) await sendCandidateInvitations(candidateInvitations);

  const genericInvitations = invitations.filter((i) => i.emailMode === 'generique');
  for (const invitation of genericInvitations) {
    try {
      await sendUserInvitation(invitation);
    } catch (error) {
      console.error('Compte créé mais invitation non envoyée :', invitation.email, error);
    }
  }
}
