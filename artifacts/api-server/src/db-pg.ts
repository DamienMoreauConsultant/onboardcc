/**
 * db-pg.ts — Connexion PostgreSQL via pg.Pool
 *
 * Ce fichier crée un pool de connexions réutilisables vers la base de données.
 * Un pool évite d'ouvrir/fermer une connexion TCP à chaque requête (coûteux) :
 * pg.Pool maintient un ensemble de connexions prêtes à l'emploi.
 *
 * Usage dans une route Express :
 *   import pool from '../db-pg';
 *   const { rows } = await pool.query('SELECT * FROM langue');
 */

import pg from 'pg';

const { Pool } = pg;

// La variable DATABASE_URL est fournie par l'environnement Replit.
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL doit être défini. Avez-vous configuré la base de données ?');
}

/**
 * Pool partagé pour toute l'application.
 * On l'exporte en singleton : tous les modules importent le même pool,
 * ce qui garantit que le nombre de connexions reste maîtrisé.
 */
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Limite à 10 connexions simultanées (valeur raisonnable pour un prototype)
  max: 10,
  // Si une connexion est idle depuis 30 s, elle est fermée
  idleTimeoutMillis: 30_000,
  // Timeout de connexion : 5 s
  connectionTimeoutMillis: 5_000,
});

// Journalisation des erreurs inattendues sur le pool (ex. perte de connexion réseau)
pool.on('error', (err) => {
  console.error('Erreur inattendue sur le pool PostgreSQL :', err);
});

export default pool;
