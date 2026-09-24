/* Doit rester le tout premier import : app.ts (et ses dépendances, ex. db-pg.ts)
   lisent process.env dès leur chargement — dotenv doit avoir déjà rempli les
   variables avant que ce module graph ne s'exécute. Sans effet en production
   (cPanel injecte déjà les variables dans process.env ; dotenv ne les écrase
   jamais). Root cause du 19/09/2026 : ce fichier ne chargeait jamais .env,
   contrairement aux scripts utilitaires (checkSeed.ts, hashTestPasswords.ts). */
import 'dotenv/config';
import app from "./app";
import { logger } from "./lib/logger";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");
});
