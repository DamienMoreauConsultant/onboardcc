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
import pool from '../db-pg';
import { requireRole } from '../middleware/requireRole';

const router = Router();

/**
 * POST /api/auth/login
 *
 * Corps attendu : { login: string, password: string }
 *
 * Processus :
 *   1. Recherche l'utilisateur par son login dans la table user_, joint avec contact.
 *   2. Vérifie le mot de passe fourni contre le hash bcrypt stocké en base.
 *   3. Déduit le rôle depuis contact.role (CAN, CM1, CM2, CHZ, ADMIN) ou 'REC' si absent.
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
         u.password AS hash,
         c.id_contact,
         c.role,
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

    // Vérifie le mot de passe contre le hash bcrypt stocké en base
    // bcrypt.compare est résistant aux attaques par timing (constant-time comparison)
    const passwordValid = await bcrypt.compare(password, user.hash);
    if (!passwordValid) {
      res.status(401).json({ error: 'Identifiant ou mot de passe incorrect.' });
      return;
    }

    // Détermine le rôle applicatif via une liste blanche explicite.
    // Tout rôle absent de la liste → 'REC' (staff DCC, recruteur interne).
    // Cela protège contre des rôles mal formés ou non prévus stockés en base.
    const KNOWN_ROLES = ['CAN', 'CM1', 'CM2', 'CHZ', 'ADMIN'] as const;
    type KnownRole = typeof KNOWN_ROLES[number];
    const role: string = KNOWN_ROLES.includes(user.role as KnownRole) ? user.role : 'REC';

    // Crée le payload du JWT (jamais stocker d'informations sensibles dans le JWT)
    const payload = {
      id_user: user.id_user,
      role,
      id_contact: user.id_contact,
      id_candidat: user.id_candidat ?? null,
      nom: user.nom || '',
      prenom: user.prenom || '',
    };

    // Supporte JWT_SECRET ou SESSION_SECRET (déjà disponible dans l'environnement Replit)
    const secret = (process.env.JWT_SECRET || process.env.SESSION_SECRET)!;
    const expireHours = parseInt(process.env.JWT_EXPIRE_HOURS ?? '8', 10);

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
      role,
      id_contact: user.id_contact,
      id_candidat: user.id_candidat ?? null,
      nom: user.nom || '',
      prenom: user.prenom || '',
    });
  } catch (err) {
    console.error('Erreur lors de la connexion :', err);
    res.status(500).json({ error: 'Erreur interne du serveur.' });
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
