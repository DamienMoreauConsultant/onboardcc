/**
 * app.ts — Configuration Express principale
 *
 * Ce fichier configure l'application Express :
 *   - Logging des requêtes HTTP (pino-http)
 *   - CORS en liste blanche explicite (jamais origin: '*')
 *   - Cookie parser (nécessaire pour lire le JWT HttpOnly)
 *   - Parsing JSON + URL-encoded
 *   - Montage de toutes les routes sous /api
 */

import express, { type Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

// CORS : n'autorise que le frontend (jamais origin: '*' pour une app avec cookies)
// credentials: true est requis pour que le navigateur envoie les cookies HttpOnly
// En développement Replit, les deux services (frontend + backend) sont servis via le même
// domaine proxié, donc same-origin. FRONTEND_URL est en fallback pour usage local.
const corsOrigin =
  process.env.FRONTEND_URL ||
  (process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : "http://localhost:5173");
app.use(
  cors({
    origin: corsOrigin,
    credentials: true,
  })
);

// Cookie parser : lit le cookie 'token' (JWT HttpOnly) sur chaque requête
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

export default app;
