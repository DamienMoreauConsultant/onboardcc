/**
 * lib/emailRules.ts — Règle unique sur les adresses email (UAT-02 D5, 07/10/2026)
 *
 * Une adresse email ne peut servir qu'à UN compte : elle ne doit exister
 *   - dans AUCUN login de la table user_ (toute la table, sans tenir compte de la casse) ;
 *   - dans AUCUN email de contact RATTACHÉ À UN COMPTE (les contacts sans compte — MIS, PAR,
 *     candidats pas encore en AP2 — ne sont pas concernés).
 *
 * Les emails et logins sont enregistrés en minuscules et sans espaces autour (UAT-02 D7).
 */

import type { Pool, PoolClient } from 'pg';

type Db = Pick<Pool | PoolClient, 'query'>;

/** Adresse normalisée : espaces retirés et minuscules. Chaîne vide si la valeur n'est pas un texte. */
export function normalizeEmail(value: unknown): string {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

/** Adresse déjà utilisée par un autre compte (identifiant ou contact). */
export class EmailConflictError extends Error {
  readonly code = 'EMAIL_CONFLICT';
  constructor(readonly email: string) {
    super(`L’adresse « ${email} » est déjà utilisée par un autre compte (identifiant de connexion ou email d’un contact). Corrigez l’une des deux adresses avant de continuer.`);
  }
}

/**
 * Vérifie que `email` est libre. `excludeIdContact` désigne le contact en cours de création ou de
 * modification : son propre compte et son propre email ne comptent pas comme un conflit.
 */
export async function assertEmailAvailable(db: Db, email: string, excludeIdContact: number | null = null): Promise<void> {
  const normalized = normalizeEmail(email);
  if (!normalized) return;
  const result = await db.query(
    `SELECT 1 FROM user_ u
      WHERE lower(u.login)=$1 AND ($2::int IS NULL OR u.id_contact<>$2)
     UNION ALL
     SELECT 1 FROM contact c JOIN user_ u ON u.id_contact=c.id_contact
      WHERE lower(c.email_contact)=$1 AND ($2::int IS NULL OR c.id_contact<>$2)
     LIMIT 1`,
    [normalized, excludeIdContact],
  );
  if (result.rows.length) throw new EmailConflictError(normalized);
}

/**
 * Version « lot » pour la vérification des imports : renvoie, pour chaque adresse demandée, l'ensemble
 * des contacts qui la possèdent déjà (en tant que login ou que email d'un contact avec compte).
 */
export async function findEmailOwners(db: Db, emails: string[]): Promise<Map<string, Set<number>>> {
  const owners = new Map<string, Set<number>>();
  const unique = [...new Set(emails.map(normalizeEmail).filter(Boolean))];
  if (!unique.length) return owners;
  const result = await db.query<{ email: string; id_contact: number }>(
    `SELECT lower(u.login) AS email, u.id_contact FROM user_ u WHERE lower(u.login)=ANY($1::text[])
     UNION
     SELECT lower(c.email_contact) AS email, c.id_contact
       FROM contact c JOIN user_ u ON u.id_contact=c.id_contact
      WHERE lower(c.email_contact)=ANY($1::text[])`,
    [unique],
  );
  for (const row of result.rows) {
    if (!owners.has(row.email)) owners.set(row.email, new Set());
    owners.get(row.email)!.add(row.id_contact);
  }
  return owners;
}
