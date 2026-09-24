/**
 * scripts/checkSeed.ts — Vérifie que le schéma de base de données est bien en place
 *
 * Outil de diagnostic pour l'installation/le déploiement, PAS utilisé par l'application
 * elle-même au runtime (elle ne l'importe jamais). Destiné à quiconque initialise une base
 * (Damien, ou plus tard un informaticien côté DCC) : à exécuter une fois juste après avoir
 * chargé le schéma — via documentation/prompt_0_sql_versionAvantProd_20260918.sql (poste de dev
 * local, dans ce même dépôt de code — fichier unique depuis le 18/09/2026, ancien
 * seed_referentiels.sql du dépôt "Projet Fil Rouge" archivé) ou via backups/schema_only_...pg96.sql
 * (o2switch, voir 1-procedure_deploiement_passerelle.md §3.3-3.5) — pour confirmer que la base
 * est complète avant de démarrer le serveur.
 *
 * Usage : pnpm --filter @workspace/api-server run check-seed
 *
 * En cas d'échec : la base est incomplète ou vide — recharger le schéma depuis l'un des
 * fichiers cités ci-dessus (jamais l'ancien prompt_0_sql_1783630957105.sql, archivé et obsolète
 * depuis le 18/09/2026 — voir backups/prompt_0_sql_1783630957105_OBSOLETE.sql).
 */

import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;

// Note : le schéma DCC contient 42 tables (mis à jour le 18/09/2026 — 35 dans la
// spécification prompt0 initiale, 39 en comptant les tables de liaison N:N, +3 ajoutées
// depuis : type_billet_avion (migration 005), aide_contextuelle (migration 010), et
// historique_poste (créée à la volée par l'appli — voir ensurePosteHistory() dans
// routes/postes.ts — dès qu'un poste est fermé/réouvert pour la première fois).
const EXPECTED_TABLE_COUNT = 42;

async function checkSeed() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL non défini. Vérifiez votre fichier .env ou les variables Replit.');
    process.exit(1);
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    // Compte le nombre de tables dans le schéma public
    const result = await pool.query(
      `SELECT count(*)::int AS cnt
       FROM information_schema.tables
       WHERE table_schema = 'public' AND table_type = 'BASE TABLE'`
    );

    const count: number = result.rows[0].cnt;

    if (count === EXPECTED_TABLE_COUNT) {
      console.log(`✅ Base de données correctement initialisée : ${count} tables trouvées (attendu : ${EXPECTED_TABLE_COUNT}).`);
    } else {
      console.error(`❌ Nombre de tables incorrect : ${count} trouvées, ${EXPECTED_TABLE_COUNT} attendues.`);
      console.error('   → Rechargez le schéma (voir documentation/prompt_0_sql_versionAvantProd_20260918.sql pour un poste de dev local).');
      process.exit(1);
    }

    // Vérifie quelques tables clés pour s'assurer que les données de référence sont en place
    const refCheck = await pool.query(
      `SELECT
         (SELECT count(*) FROM langue)           AS nb_langues,
         (SELECT count(*) FROM region)           AS nb_regions,
         (SELECT count(*) FROM etat_candidat)    AS nb_etats_candidat,
         (SELECT count(*) FROM etat_opportunite) AS nb_etats_opportunite`
    );

    const refs = refCheck.rows[0];
    console.log(`   Données de référence :`);
    console.log(`   - Langues           : ${refs.nb_langues}`);
    console.log(`   - Régions           : ${refs.nb_regions}`);
    console.log(`   - États candidat    : ${refs.nb_etats_candidat}`);
    console.log(`   - États opportunité : ${refs.nb_etats_opportunite}`);
  } catch (err) {
    console.error('❌ Erreur lors de la vérification :', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

checkSeed();
