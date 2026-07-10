/**
 * scripts/checkSeed.ts — Vérifie que le schéma de base de données est bien en place
 *
 * Ce script est à exécuter une fois après avoir lancé prompt_0_sql.sql sur la base.
 * Il vérifie que les 35 tables attendues existent dans le schéma public.
 *
 * Usage : pnpm --filter @workspace/api-server run check-seed
 *
 * En cas d'échec : relancer prompt_0_sql.sql sur la base de données PostgreSQL cible.
 */

import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;

// Note : le schéma DCC contient 39 tables (et non 35 comme indiqué initialement dans
// la spécification prompt0 — le compte réel inclut toutes les tables de liaison N:N).
const EXPECTED_TABLE_COUNT = 39;

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
      console.error('   → Relancez le fichier prompt_0_sql.sql sur la base de données PostgreSQL cible.');
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
