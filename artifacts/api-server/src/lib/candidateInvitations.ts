import nodemailer from 'nodemailer';

export type CandidateInvitation = {
  email: string;
  prenom: string | null;
  temporaryPassword: string;
};

export type UserInvitation = CandidateInvitation & { roleLabel: string };

export function smtpIsConfigured(): boolean {
  return Boolean(
    process.env.SMTP_HOST
      && process.env.SMTP_PORT
      && process.env.SMTP_USER
      && process.env.SMTP_PASSWORD
      && process.env.SMTP_FROM,
  );
}

export async function sendCandidateInvitations(invitations: CandidateInvitation[]): Promise<void> {
  if (!invitations.length) return;
  if (!smtpIsConfigured()) throw new Error('SMTP_NOT_CONFIGURED');

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  for (const invitation of invitations) {
    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: invitation.email,
      subject: 'Votre espace candidat DCC',
      text: [
        `Bonjour${invitation.prenom ? ` ${invitation.prenom}` : ''},`,
        '',
        'Votre espace candidat DCC est prêt.',
        `Identifiant : ${invitation.email}`,
        `Mot de passe temporaire : ${invitation.temporaryPassword}`,
        '',
        'Connectez-vous puis changez ce mot de passe dès votre première connexion.',
      ].join('\n'),
    });
  }
}

/** Envoie une invitation pour tout compte DCC sans dupliquer la configuration SMTP. */
export async function sendUserInvitation(invitation: UserInvitation): Promise<void> {
  if (!smtpIsConfigured()) throw new Error('SMTP_NOT_CONFIGURED');
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
  });
  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: invitation.email,
    subject: 'Votre accès DCC',
    text: [
      `Bonjour${invitation.prenom ? ` ${invitation.prenom}` : ''},`,
      '',
      `Votre compte DCC (${invitation.roleLabel}) est prêt.`,
      `Identifiant : ${invitation.email}`,
      `Mot de passe temporaire : ${invitation.temporaryPassword}`,
      '',
      'Connectez-vous puis changez ce mot de passe dès votre première connexion.',
    ].join('\n'),
  });
}

export async function sendPasswordResetEmail(email: string, prenom: string | null, resetUrl: string): Promise<void> {
  if (!smtpIsConfigured()) throw new Error('SMTP_NOT_CONFIGURED');
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
  });
  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: email,
    subject: 'Réinitialisation de votre mot de passe DCC',
    text: [
      `Bonjour${prenom ? ` ${prenom}` : ''},`,
      '',
      'Une demande de réinitialisation a été effectuée pour votre espace DCC.',
      'Utilisez le lien ci-dessous dans les 30 minutes pour choisir un nouveau mot de passe :',
      resetUrl,
      '',
      'Si vous n’êtes pas à l’origine de cette demande, contactez la DCC.',
    ].join('\n'),
  });
}