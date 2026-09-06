/**
 * routes/auth.ts — Authentification : connexion et changement de mot de passe
 *
 * Deux routes :
 *   POST /api/auth/login            → vérifie identifiant + mot de passe, pose un cookie JWT
 *   POST /api/auth/changer-password → change le mot de passe de l'utilisateur connecté
 *   POST /api/auth/logout           → supprime le cookie JWT
 *   GET  /api/auth/me               → retourne le profil de l'utilisateur connecté (utile au frontend)
 *
 * Sécurité :
 *   - Le mot de passe n'est JAMAIS retourné dans une réponse.
 *   - Le JWT est posé en cookie HttpOnly; Secure; SameSite=Strict (impossible à lire
 *     en JavaScript côté navigateur, protège contre XSS).
 *   - CORS est configuré pour n'autoriser que FRONTEND_URL (voir app.ts).
 */

import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createHash, randomBytes } from 'node:crypto';
import pool from '../db-pg';
import { requireRole } from '../middleware/requireRole';
import { sendPasswordResetEmail, smtpIsConfigured } from '../lib/candidateInvitations';
import { getJwtExpireHours, getJwtSecret } from '../lib/jwtConfig';
import { logger } from '../lib/logger';

const router = Router();
const FORGOT_PASSWORD_MESSAGE = 'Si un compte actif correspond à cet identifiant, un lien de réinitialisation sera envoyé.';

/**
 * POST /api/auth/login
 *
 * Corps attendu : { login: string, password: string }
 *
 * Processus :
 *   1. Recherche l'utilisateur par son login dans la table user_, joint avec contact.
 *   2. Vérifie le mot de passe fourni contre le hash bcrypt stocké en base.
 *   3. Charge le rôle applicatif depuis user_ et le rôle métier depuis contact.
 *   4. Crée un JWT signé avec les infos de l'utilisateur, durée JWT_EXPIRE_HOURS.
 *   5. Pose ce JWT en cookie HttpOnly sur la réponse.
 */
router.post('/login', async (req, res) => {
  const { login, password } = req.body as { login?: string; password?: string };

  if (!login || !password) {
    res.status(400).json({ error: 'Identifiant et mot de passe requis.' });
    return;
  }

  try {
    // Récupère l'utilisateur avec les infos de son contact associé
    const result = await pool.query(
      `SELECT
         u.id_user,
         u.password AS hash, u.active,
         c.id_contact,
         c.role AS role_contact,
         u.role_applicatif,
         c.nom_contact      AS nom,
         c.prenom_contact   AS prenom,
         -- Pour les candidats, récupère l'id_candidat (NULL pour les autres rôles)
         cand.id_candidat
       FROM user_ u
       JOIN contact c ON c.id_contact = u.id_contact
       LEFT JOIN candidat cand ON cand.id_contact = c.id_contact
       WHERE u.login = $1`,
      [login]
    );

    if (result.rows.length === 0) {
      // Réponse volontairement vague pour ne pas révéler si le login existe
      res.status(401).json({ error: 'Identifiant ou mot de passe incorrect.' });
      return;
    }

    const user = result.rows[0];
    if (user.active === false) {
      res.status(401).json({ error: 'Identifiant ou mot de passe incorrect.' });
      return;
    }

    // Vérifie le mot de passe contre le hash bcrypt stocké en base
    // bcrypt.compare est résistant aux attaques par timing (constant-time comparison)
    const passwordValid = await bcrypt.compare(password, user.hash);
    if (!passwordValid) {
      res.status(401).json({ error: 'Identifiant ou mot de passe incorrect.' });
      return;
    }

    // Liste blanche stricte des rôles applicatifs reconnus par l'application.
    // Un rôle absent de cette liste → refus d'accès immédiat (jamais de repli silencieux
    // vers un rôle plus ou moins privilégié — cela masquerait une corruption de données).
    const ALLOWED_APPLICATION_ROLES = ['ADMIN', 'RECRUTEUR', 'CM', 'CANDIDAT'] as const;
    type AllowedApplicationRole = typeof ALLOWED_APPLICATION_ROLES[number];
    if (!ALLOWED_APPLICATION_ROLES.includes(user.role_applicatif as AllowedApplicationRole)) {
      res.status(403).json({
        error: `Rôle applicatif '${user.role_applicatif ?? 'null'}' non reconnu. Accès refusé. Contactez l'administrateur.`,
      });
      return;
    }
    const role_applicatif = user.role_applicatif as AllowedApplicationRole;

    // Crée le payload du JWT (jamais stocker d'informations sensibles dans le JWT)
    const payload = {
      id_user: user.id_user,
      role_applicatif,
      role_contact: user.role_contact,
      id_contact: user.id_contact,
      id_candidat: user.id_candidat ?? null,
      nom: user.nom || '',
      prenom: user.prenom || '',
    };

    const secret = getJwtSecret();
    const expireHours = getJwtExpireHours();

    const token = jwt.sign(payload, secret, { expiresIn: `${expireHours}h` });

    // Pose le JWT dans un cookie HttpOnly :
    // - HttpOnly : inaccessible depuis JavaScript (protection XSS)
    // - Secure   : envoyé uniquement en HTTPS (en production)
    // - SameSite=Strict : protection CSRF
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: expireHours * 60 * 60 * 1000,
    });

    // Retourne les infos utiles au frontend (jamais le hash du mot de passe)
    res.json({
      id_user: user.id_user,
      role_applicatif,
      role_contact: user.role_contact,
      id_contact: user.id_contact,
      id_candidat: user.id_candidat ?? null,
      nom: user.nom || '',
      prenom: user.prenom || '',
    });
  } catch (err) {
    logger.error({ err: err instanceof Error ? err.message : 'unknown' }, 'Échec technique de connexion');
    res.status(500).json({ error: 'Erreur interne du serveur.' });
  }
});

router.post('/mot-de-passe-oublie', async (req, res) => {
  const login = typeof req.body?.login === 'string' ? req.body.login.trim() : '';
  if (!login) return void res.status(400).json({error:'Identifiant ou email requis.'});
  try {
    const found = await pool.query(
      `SELECT u.id_user,u.active,c.email_contact,c.prenom_contact
       FROM user_ u JOIN contact c ON c.id_contact=u.id_contact
       WHERE lower(u.login)=lower($1) OR lower(c.email_contact)=lower($1)
       LIMIT 1`,
      [login],
    );
    if(!found.rows.length || found.rows[0].active===false) return void res.status(202).json({message:FORGOT_PASSWORD_MESSAGE});
    if(!smtpIsConfigured()) {
      logger.warn('Demande de réinitialisation ignorée : SMTP non configuré');
      return void res.status(202).json({message:FORGOT_PASSWORD_MESSAGE});
    }
    const nonce=randomBytes(24).toString('base64url');
    const nonceHash=createHash('sha256').update(nonce).digest('hex');
    const claimed=await pool.query(
      `UPDATE user_
       SET password_reset_requested_at=NOW(),password_reset_nonce_hash=$1
       WHERE id_user=$2
         AND (password_reset_requested_at IS NULL OR password_reset_requested_at < NOW()-INTERVAL '15 minutes')
       RETURNING id_user`,
      [nonceHash,found.rows[0].id_user],
    );
    if(!claimed.rows.length) return void res.status(202).json({message:FORGOT_PASSWORD_MESSAGE});
    const secret=getJwtSecret();
    const token=jwt.sign({purpose:'password-reset',sub:String(found.rows[0].id_user),nonce},secret,{expiresIn:'30m'});
    const frontendUrl=(process.env.FRONTEND_URL || '').replace(/\/$/,'');
    const resetUrl=`${frontendUrl}/login?reset_token=${encodeURIComponent(token)}`;
    try {
      await sendPasswordResetEmail(found.rows[0].email_contact,found.rows[0].prenom_contact,resetUrl);
    } catch(error) {
      try {
        await pool.query('UPDATE user_ SET password_reset_nonce_hash=NULL WHERE id_user=$1',[found.rows[0].id_user]);
      } catch(cleanupError) {
        logger.error({err:cleanupError instanceof Error ? cleanupError.message : 'unknown'}, 'Échec du nettoyage après erreur SMTP');
      }
      logger.error({err:error instanceof Error ? error.message : 'unknown'}, 'Échec de l’envoi du courriel de réinitialisation');
      return void res.status(202).json({message:FORGOT_PASSWORD_MESSAGE});
    }
    res.status(202).json({message:FORGOT_PASSWORD_MESSAGE});
  } catch(err) {
    logger.error({err:err instanceof Error ? err.message : 'unknown'}, 'Échec technique de réinitialisation');
    res.status(202).json({message:FORGOT_PASSWORD_MESSAGE});
  }
});

router.post('/reinitialiser-password', async (req,res) => {
  const token=typeof req.body?.token==='string'?req.body.token:'';
  const newPassword=typeof req.body?.nouveau_password==='string'?req.body.nouveau_password:'';
  if(!token || newPassword.length<8) return void res.status(400).json({error:'Lien invalide ou mot de passe de moins de 8 caractères.'});
  try {
    const secret=getJwtSecret();
    const payload=jwt.verify(token,secret) as jwt.JwtPayload & {purpose?:string;nonce?:string};
    if(payload.purpose!=='password-reset' || !payload.sub || !payload.nonce) throw new Error('INVALID');
    const nonceHash=createHash('sha256').update(payload.nonce).digest('hex');
    const updated=await pool.query(
      `UPDATE user_
       SET password=$1,password_reset_nonce_hash=NULL,password_reset_requested_at=NULL
        WHERE id_user=$2 AND password_reset_nonce_hash=$3 AND active=true
       RETURNING id_user`,
      [await bcrypt.hash(newPassword,12),payload.sub,nonceHash],
    );
    if(!updated.rows.length) throw new Error('INVALID');
    res.json({message:'Mot de passe réinitialisé. Vous pouvez vous connecter.'});
  } catch(error) {
    res.status(400).json({error:'Ce lien de réinitialisation est invalide, expiré ou déjà utilisé.'});
  }
});

/**
 * POST /api/auth/changer-password
 *
 * Corps attendu : { ancien_password: string, nouveau_password: string }
 * Requiert d'être connecté (middleware requireRole).
 *
 * Processus :
 *   1. Vérifie l'ancien mot de passe contre le hash en base.
 *   2. Valide la complexité du nouveau mot de passe.
 *   3. Hashe le nouveau mot de passe et l'enregistre.
 */
router.post('/changer-password', requireRole([]), async (req, res) => {
  const { ancien_password, nouveau_password } = req.body as {
    ancien_password?: string;
    nouveau_password?: string;
  };

  if (!ancien_password || !nouveau_password) {
    res.status(400).json({ error: 'Ancien et nouveau mot de passe requis.' });
    return;
  }

  if (nouveau_password.length < 8) {
    res.status(400).json({ error: 'Le nouveau mot de passe doit contenir au moins 8 caractères.' });
    return;
  }

  try {
    // Récupère le hash actuel de l'utilisateur connecté
    const result = await pool.query(
      'SELECT password AS hash FROM user_ WHERE id_user = $1',
      [req.user!.id_user]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Utilisateur non trouvé.' });
      return;
    }

    const validOld = await bcrypt.compare(ancien_password, result.rows[0].hash);
    if (!validOld) {
      res.status(401).json({ error: 'Ancien mot de passe incorrect.' });
      return;
    }

    // Hashe le nouveau mot de passe (saltRounds=12 : bon compromis sécurité/performance)
    const newHash = await bcrypt.hash(nouveau_password, 12);

    await pool.query(
      'UPDATE user_ SET password = $1 WHERE id_user = $2',
      [newHash, req.user!.id_user]
    );

    res.json({ message: 'Mot de passe changé avec succès.' });
  } catch (err) {
    console.error('Erreur changement de mot de passe :', err);
    res.status(500).json({ error: 'Erreur interne du serveur.' });
  }
});

/**
 * POST /api/auth/logout
 *
 * Supprime le cookie JWT côté serveur en le remplaçant par un cookie vide expiré.
 */
router.post('/logout', (_req, res) => {
  res.cookie('token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    expires: new Date(0),
  });
  res.json({ message: 'Déconnexion réussie.' });
});

/**
 * GET /api/auth/me
 *
 * Retourne le profil de l'utilisateur connecté, utile au frontend pour
 * initialiser le contexte d'authentification sans redemander de login.
 */
router.get('/me', requireRole([]), (req, res) => {
  res.json(req.user);
});

export default router;
