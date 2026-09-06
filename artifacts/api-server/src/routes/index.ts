/**
 * routes/index.ts — Routeur principal de l'API
 *
 * Ce fichier monte tous les sous-routeurs sur leurs préfixes respectifs.
 * L'application Express monte ce routeur sous /api (voir app.ts).
 *
 * Structure des préfixes :
 *   /api/healthz        → vérification de santé (health.ts)
 *   /api/auth/*         → authentification, changement de mot de passe
 *   /api/admin/*        → module Admin : CRUD référentiels (rôle ADMIN)
 *   /api/candidats/*    → gestion des candidats (rôles REC, CM, CAN)
 *   /api/postes/*       → gestion des fiches de poste (rôles REC, CM)
 *   /api/opportunites/* → matching candidat-poste (rôles REC, CM)
 */

import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import adminRouter from "./admin";
import candidatsRouter from "./candidats";
import postesRouter from "./postes";
import opportunitesRouter from "./opportunites";
import recruteurRouter from "./recruteur";

const router: IRouter = Router();

// Route de santé (sans authentification, utilisée par les outils de monitoring)
router.use(healthRouter);

// Authentification : login, logout, changer-password, me
router.use("/auth", authRouter);

// Module Admin : CRUD sur les tables référentielles (ADMIN uniquement)
router.use("/admin", adminRouter);

// Candidats (développé au prompt 3)
router.use("/candidats", candidatsRouter);

// Fiches de poste (développé au prompt 2)
router.use("/postes", postesRouter);

// Opportunités de matching (développé au prompt 4)
router.use("/opportunites", opportunitesRouter);

router.use("/recruteur", recruteurRouter);

export default router;
