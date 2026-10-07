/**
 * lib/emailTemplates.ts — Modèles d'email modifiables par l'administrateur (UAT-08 D8, 07/10/2026)
 *
 * Le texte de chaque email vit dans la table email_template (Admin > Modèle d'email). Ce module :
 *   - décrit les 6 types d'email, les variables autorisées et celles qui sont obligatoires ;
 *   - lit un modèle (avec un texte de secours identique au texte livré si la ligne manque) ;
 *   - remplace les variables {prenom}, {identifiant}… par leur valeur ;
 *   - valide un modèle avant son enregistrement ;
 *   - envoie un email à partir d'un modèle.
 *
 * Les textes sont du TEXTE BRUT : aucune mise en forme, donc aucun risque d'injection de code.
 */

import nodemailer from 'nodemailer';
import type { Pool, PoolClient } from 'pg';

type Db = Pick<Pool | PoolClient, 'query'>;

export type EmailType =
  | 'INVITATION_CANDIDAT'
  | 'INVITATION_CM'
  | 'INVITATION_UTILISATEUR'
  | 'NOTIFICATION_CM'
  | 'CHANGEMENT_EMAIL'
  | 'REINITIALISATION_MDP';

export type EmailVariable = 'prenom' | 'identifiant' | 'mot_de_passe' | 'lien' | 'role' | 'nombre';

export type EmailTypeMeta = {
  libelle: string;
  /** Variables que l'administrateur peut utiliser dans ce modèle. */
  variables: EmailVariable[];
  /** Variables sans lesquelles le mail serait inutilisable (ex. mot de passe provisoire). */
  obligatoires: EmailVariable[];
  /** Seul le modèle de notification peut être groupé (fréquence en heures > 0). */
  groupable: boolean;
};

export const EMAIL_TYPES: Record<EmailType, EmailTypeMeta> = {
  INVITATION_CANDIDAT: { libelle: 'Invitation du candidat (création du compte)', variables: ['prenom', 'identifiant', 'mot_de_passe', 'lien'], obligatoires: ['identifiant', 'mot_de_passe'], groupable: false },
  INVITATION_CM: { libelle: 'Invitation du chargé de mission (import des postes)', variables: ['prenom', 'identifiant', 'mot_de_passe', 'lien'], obligatoires: ['identifiant', 'mot_de_passe'], groupable: false },
  INVITATION_UTILISATEUR: { libelle: 'Invitation d’un utilisateur créé par l’administrateur', variables: ['prenom', 'identifiant', 'mot_de_passe', 'lien', 'role'], obligatoires: ['identifiant', 'mot_de_passe'], groupable: false },
  NOTIFICATION_CM: { libelle: 'Notifications groupées du chargé de mission', variables: ['prenom', 'lien', 'nombre'], obligatoires: [], groupable: true },
  CHANGEMENT_EMAIL: { libelle: 'Changement d’adresse email (nouvel identifiant)', variables: ['prenom', 'identifiant', 'lien'], obligatoires: ['identifiant'], groupable: false },
  REINITIALISATION_MDP: { libelle: 'Réinitialisation du mot de passe', variables: ['prenom', 'lien'], obligatoires: ['lien'], groupable: false },
};

export const EMAIL_TYPE_LIST = Object.keys(EMAIL_TYPES) as EmailType[];

export function isEmailType(value: unknown): value is EmailType {
  return typeof value === 'string' && value in EMAIL_TYPES;
}

export type EmailTemplate = {
  email_type: EmailType;
  libelle: string;
  objet: string;
  contenu: string;
  frequence_heures: number;
};

/** Textes de secours : identiques à ceux livrés par la migration 022 (jamais utilisés si la table est à jour). */
const INVITATION_FOOTER = 'Connectez-vous puis changez ce mot de passe dès votre première connexion.';
const FALLBACKS: Record<EmailType, Pick<EmailTemplate, 'objet' | 'contenu' | 'frequence_heures'>> = {
  INVITATION_CANDIDAT: { objet: 'Votre espace candidat DCC', contenu: `Bonjour {prenom},\n\nVotre espace candidat DCC est prêt.\nIdentifiant : {identifiant}\nMot de passe temporaire : {mot_de_passe}\n\n${INVITATION_FOOTER}`, frequence_heures: 0 },
  INVITATION_CM: { objet: 'Votre accès DCC', contenu: `Bonjour {prenom},\n\nVotre compte DCC (CM) est prêt.\nIdentifiant : {identifiant}\nMot de passe temporaire : {mot_de_passe}\n\n${INVITATION_FOOTER}`, frequence_heures: 0 },
  INVITATION_UTILISATEUR: { objet: 'Votre accès DCC', contenu: `Bonjour {prenom},\n\nVotre compte DCC ({role}) est prêt.\nIdentifiant : {identifiant}\nMot de passe temporaire : {mot_de_passe}\n\n${INVITATION_FOOTER}`, frequence_heures: 0 },
  NOTIFICATION_CM: { objet: 'Nouvelles notifications Passerelle', contenu: 'Bonjour {prenom},\n\nVous avez de nouvelles notifications dans Passerelle que vous pouvez consulter sur votre Home page.\n\nAccéder à Passerelle : {lien}', frequence_heures: 1 },
  CHANGEMENT_EMAIL: { objet: 'Votre identifiant Passerelle a changé', contenu: 'Bonjour {prenom},\n\nL\'adresse email de votre compte Passerelle a été mise à jour : votre identifiant de connexion est désormais {identifiant}.\n\nVous pouvez choisir un nouveau mot de passe depuis la page de connexion, avec « Mot de passe oublié » :\n{lien}\n\nSi vous n\'êtes pas à l\'origine de cette modification, contactez la DCC.', frequence_heures: 0 },
  REINITIALISATION_MDP: { objet: 'Réinitialisation de votre mot de passe DCC', contenu: 'Bonjour {prenom},\n\nUne demande de réinitialisation a été effectuée pour votre espace DCC.\nUtilisez le lien ci-dessous dans les 30 minutes pour choisir un nouveau mot de passe :\n{lien}\n\nSi vous n’êtes pas à l’origine de cette demande, contactez la DCC.', frequence_heures: 0 },
};

export const OBJET_MAX = 150;
export const CONTENU_MAX = 3000;
export const FREQUENCE_MAX = 168;

export async function loadTemplate(db: Db, type: EmailType): Promise<EmailTemplate> {
  try {
    const result = await db.query('SELECT email_type,libelle,objet,contenu,frequence_heures FROM email_template WHERE email_type=$1', [type]);
    if (result.rows.length) return result.rows[0] as EmailTemplate;
  } catch (error) {
    console.error('Lecture du modèle d’email impossible, texte de secours utilisé :', type, error);
  }
  return { email_type: type, libelle: EMAIL_TYPES[type].libelle, ...FALLBACKS[type] };
}

export async function loadAllTemplates(db: Db): Promise<EmailTemplate[]> {
  const result = await db.query('SELECT email_type,libelle,objet,contenu,frequence_heures FROM email_template');
  const byType = new Map<string, EmailTemplate>(result.rows.map((row) => [row.email_type, row as EmailTemplate]));
  return EMAIL_TYPE_LIST.map((type) => byType.get(type) ?? { email_type: type, libelle: EMAIL_TYPES[type].libelle, ...FALLBACKS[type] });
}

export type EmailVariables = Partial<Record<EmailVariable, string | number | null | undefined>>;

/** Remplace {variable} par sa valeur ; une variable absente devient vide ; une variable inconnue est laissée telle quelle. */
export function renderText(text: string, variables: EmailVariables): string {
  return text
    .replace(/\{([a-z_]+)\}/g, (whole, key: string) => (key in variables ? String(variables[key as EmailVariable] ?? '') : whole))
    .replace(/ +,/g, ',');
}

export type TemplateValidation = { ok: true } | { ok: false; error: string };

/** Contrôle d'un modèle saisi par l'administrateur : longueurs, variables autorisées, variables obligatoires. */
export function validateTemplate(type: EmailType, objet: unknown, contenu: unknown, frequence: unknown): TemplateValidation {
  const meta = EMAIL_TYPES[type];
  if (typeof objet !== 'string' || !objet.trim()) return { ok: false, error: 'L’objet du mail est obligatoire.' };
  if (objet.trim().length > OBJET_MAX) return { ok: false, error: `L’objet est limité à ${OBJET_MAX} caractères.` };
  if (/[\r\n]/.test(objet)) return { ok: false, error: 'L’objet doit tenir sur une seule ligne.' };
  if (typeof contenu !== 'string' || !contenu.trim()) return { ok: false, error: 'Le texte du mail est obligatoire.' };
  if (contenu.length > CONTENU_MAX) return { ok: false, error: `Le texte est limité à ${CONTENU_MAX} caractères (actuellement ${contenu.length}).` };
  const used = new Set([...(objet + '\n' + contenu).matchAll(/\{([a-z_]+)\}/g)].map((match) => match[1]));
  const unknown = [...used].filter((name) => !meta.variables.includes(name as EmailVariable));
  if (unknown.length) {
    return { ok: false, error: `Variable(s) inconnue(s) pour ce modèle : ${unknown.map((name) => `{${name}}`).join(', ')}. Variables autorisées : ${meta.variables.map((name) => `{${name}}`).join(', ')}.` };
  }
  const missing = meta.obligatoires.filter((name) => !contenu.includes(`{${name}}`));
  if (missing.length) {
    return { ok: false, error: `Le texte doit contenir ${missing.map((name) => `{${name}}`).join(' et ')} : sans cela, ce mail serait inutilisable.` };
  }
  if (!Number.isInteger(frequence) || (frequence as number) < 0 || (frequence as number) > FREQUENCE_MAX) {
    return { ok: false, error: `La fréquence doit être un nombre entier d’heures compris entre 0 et ${FREQUENCE_MAX}.` };
  }
  if (!meta.groupable && frequence !== 0) return { ok: false, error: 'Ce modèle est toujours envoyé immédiatement : la fréquence doit rester à 0.' };
  return { ok: true };
}

export function smtpIsConfigured(): boolean {
  return Boolean(
    process.env.SMTP_HOST
      && process.env.SMTP_PORT
      && process.env.SMTP_USER
      && process.env.SMTP_PASSWORD
      && process.env.SMTP_FROM,
  );
}

function transport() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
  });
}

/** Adresse publique de l'application (sans barre finale), utilisée pour la variable {lien}. */
export function applicationUrl(): string {
  return (process.env.FRONTEND_URL || '').split(',')[0].trim().replace(/\/$/, '');
}

/** Envoie un email à partir d'un modèle. Lève SMTP_NOT_CONFIGURED si la messagerie n'est pas paramétrée. */
export async function sendTemplatedEmail(db: Db, type: EmailType, to: string, variables: EmailVariables, overrides?: { objet?: string; contenu?: string }): Promise<void> {
  if (!smtpIsConfigured()) throw new Error('SMTP_NOT_CONFIGURED');
  const template = await loadTemplate(db, type);
  const values: EmailVariables = { lien: applicationUrl(), ...variables };
  await transport().sendMail({
    from: process.env.SMTP_FROM,
    to,
    subject: renderText(overrides?.objet ?? template.objet, values),
    text: renderText(overrides?.contenu ?? template.contenu, values),
  });
}
