/**
 * scripts/hashTestPasswords.ts — Remplace les mots de passe placeholder par de vrais hash bcrypt
 *
 * Le fichier prompt_0_sql.sql insère des utilisateurs de test avec des mots de passe
 * placeholder non fonctionnels ('$2b$12$CHANGEME_HASH_BCRYPT_*').
 * Ce script génère de vrais hash bcrypt pour le mot de passe de test 'DccTest2026!'
 * et les écrit en base.
 *
 * Usage : pnpm --filter @workspace/api-server run hash-test-passwords
 *
 * ⚠️ À n'exécuter qu'une seule fois en environnement de développement.
 *    Ne jamais utiliser ce mot de passe de test en production.
 */

import 'dotenv/config';
import pg from 'pg';
import bcrypt from 'bcryptjs';

const { Pool } = pg;

const TEST_PASSWORD = 'DccTest2026!';
// saltRounds=12 : bon compromis sécurité (2^12 itérations) / performance sur un serveur normal
const SALT_ROUNDS = 12;

// Logins des utilisateurs de test créés dans prompt_0_sql.sql
const TEST_USERS = ['loic.dupont', 'marie.nguyen', 'pierre.martin'];

async function hashTestPasswords() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL non défini.');
    process.exit(1);
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    console.log(`Génération du hash bcrypt pour le mot de passe de test "${TEST_PASSWORD}"...`);
    // bcrypt.hash génère un salt aléatoire et hashe en une seule opération
    const hash = await bcrypt.hash(TEST_PASSWORD, SALT_ROUNDS);
    console.log(`Hash généré : ${hash.substring(0, 20)}...`);

    // Mise à jour de chaque utilisateur de test
    for (const login of TEST_USERS) {
      const result = await pool.query(
        'UPDATE user_ SET password = $1 WHERE login = $2 RETURNING id_user, login',
        [hash, login]
      );

      if (result.rows.length > 0) {
        console.log(`✅ Mot de passe mis à jour pour : ${login} (id_user=${result.rows[0].id_user})`);
      } else {
        console.warn(`⚠️  Utilisateur non trouvé en base : ${login} (le script prompt_0_sql.sql a-t-il été exécuté ?)`);
      }
    }

    console.log('\n✅ Terminé. Vous pouvez vous connecter avec :');
    console.log(`   Login    : loic.dupont / marie.nguyen / pierre.martin`);
    console.log(`   Password : ${TEST_PASSWORD}`);
  } catch (err) {
    console.error('❌ Erreur :', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

hashTestPasswords();
