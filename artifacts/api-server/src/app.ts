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

import express, { type ErrorRequestHandler, type Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.disable("x-powered-by");
app.use((_req, res, next) => {
  res.setHeader("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'; base-uri 'none'");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  if (process.env.NODE_ENV === "production") {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }
  next();
});

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
const corsOrigins = (
  process.env.FRONTEND_URLS ||
  process.env.FRONTEND_URL ||
  (process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : "http://localhost:5173")
)
  .split(",")
  .map((origin) => origin.trim().replace(/\/$/, ""))
  .filter(Boolean);
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || corsOrigins.includes(origin.replace(/\/$/, ""))) return callback(null, true);
      callback(new Error("Origine non autorisée par CORS."));
    },
    credentials: true,
  })
);

// Cookie parser : lit le cookie 'token' (JWT HttpOnly) sur chaque requête
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  const message = error instanceof Error ? error.message : "";
  if (
    message.includes("CSV") ||
    message.includes("pièce jointe") ||
    message.includes("File too large") ||
    message.includes("Unexpected field")
  ) {
    res.status(message.includes("large") ? 413 : 400).json({ error: message });
    return;
  }
  if (message.includes("CORS")) {
    res.status(403).json({ error: "Origine non autorisée." });
    return;
  }
  logger.error({ err: message || "unknown" }, "Erreur HTTP non gérée");
  res.status(500).json({ error: "Erreur interne du serveur." });
};
app.use(errorHandler);

export default app;
