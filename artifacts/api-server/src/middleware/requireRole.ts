/**
 * middleware/requireRole.ts — Vérification JWT + contrôle d'accès par rôle (RBAC)
 *
 * Ce middleware est la pièce de sécurité centrale de l'application.
 * Il fait deux choses en séquence :
 *   1. Vérifie que la requête contient un cookie JWT valide et non expiré.
 *   2. Vérifie que le rôle contenu dans le JWT fait partie des rôles autorisés
 *      pour la route appelée.
 *
 * Utilisation dans une route Express :
 *   router.get('/route', requireRole(['REC', 'ADMIN']), handler);
 *
 * Sécurité :
 *   - Le JWT est lu depuis un cookie HttpOnly (jamais depuis le header Authorization
 *     ni depuis localStorage — voir conception.md §8.1).
 *   - La signature est vérifiée avec JWT_SECRET (≥ 32 caractères).
 *   - En cas d'échec, on retourne 401 (non authentifié) ou 403 (authentifié mais
 *     rôle insuffisant) — jamais de message d'erreur technique exposé au client.
 */

import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

/** Structure du payload stocké dans le JWT */
export interface JwtPayload {
  id_user: number;
  role: string;          // 'CAN' | 'CM1' | 'CM2' | 'CHZ' | 'REC' | 'ADMIN'
  id_contact: number;
  id_candidat: number | null;
  nom: string;
  prenom: string;
}

// Extension de l'interface Request d'Express pour y attacher l'utilisateur décodé
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

/**
 * Fabrique le middleware de contrôle de rôle.
 *
 * @param allowedRoles — tableau des rôles autorisés (ex. ['REC', 'ADMIN'])
 *                       Un tableau vide signifie "toute personne authentifiée est autorisée".
 *
 * Le middleware renvoie :
 *   - 401 si aucun cookie token n'est présent ou si le token est invalide/expiré.
 *   - 403 si le token est valide mais que le rôle n'est pas dans allowedRoles.
 *   - Appelle next() si tout est correct, en attachant req.user.
 */
export function requireRole(allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Récupère le JWT depuis le cookie HttpOnly posé par /api/auth/login
    const token = req.cookies?.token as string | undefined;

    if (!token) {
      // Pas de cookie → l'utilisateur n'est pas connecté
      res.status(401).json({ error: 'Non authentifié — veuillez vous connecter.' });
      return;
    }

    // Supporte JWT_SECRET ou SESSION_SECRET (déjà présent dans l'environnement Replit)
    const secret = process.env.JWT_SECRET || process.env.SESSION_SECRET;
    if (!secret) {
      // Erreur de configuration serveur — ne jamais exposer le détail au client
      console.error('Ni JWT_SECRET ni SESSION_SECRET ne sont configurés');
      res.status(500).json({ error: 'Erreur de configuration serveur.' });
      return;
    }

    let decoded: JwtPayload;
    try {
      // jwt.verify lève une exception si le token est expiré, falsifié ou malformé
      decoded = jwt.verify(token, secret) as JwtPayload;
    } catch {
      // Token invalide ou expiré
      res.status(401).json({ error: 'Session expirée ou token invalide — veuillez vous reconnecter.' });
      return;
    }

    // Vérifie que le rôle de l'utilisateur est dans la liste des rôles autorisés
    // Si allowedRoles est vide, tout utilisateur authentifié passe.
    if (allowedRoles.length > 0 && !allowedRoles.includes(decoded.role)) {
      res.status(403).json({ error: `Accès refusé — rôle '${decoded.role}' non autorisé pour cette ressource.` });
      return;
    }

    // Tout est valide : on attache les infos utilisateur à req pour les routes suivantes
    req.user = decoded;
    next();
  };
}
