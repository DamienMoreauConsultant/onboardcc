-- ============================================================================
-- reset_base_test.sql — Remet la base à zéro : supprime TOUS les postes, TOUS
-- les candidats, et tout ce qui en dépend (opportunités, vœux, contacts
-- CM/CZ/MIS/PAR, comptes candidats/CM...). Ne garde que les référentiels
-- (pays, domaines, compétences, états...) et les comptes ADMIN/RECRUTEUR.
--
-- Différence avec cleanup_postes_test.sql : celui-là ciblait une liste précise
-- de postes par crm_key (nettoyage chirurgical après un test). Celui-ci est un
-- vrai retour à zéro, sans liste à éditer — à utiliser entre deux campagnes de
-- test complètes, ou avant de proposer l'appli à la DCC pour ses propres tests.
--
-- Créé le 18/09/2026, à la demande de Damien.
--
-- MODE D'EMPLOI (identique sur o2switch et en local) :
--   1. Se connecter à la base cible : psql -h localhost -U ... -d ...
--   2. Lancer d'abord la PARTIE 1 (aperçu) seule, et LIRE le résultat.
--   3. Si ça correspond à ce que vous voulez supprimer, lancer la PARTIE 2.
--      Elle est dans une transaction : COMMIT; pour valider, ROLLBACK; sinon.
--
-- CE QUI EST SUPPRIMÉ :
--   - Tous les postes (fiche_de_poste) et tout ce qui en dépend : opportunités,
--     critères de score détaillés, langue_poste/evolue_dans/recherche,
--     gere_poste (liens vers CM/CZ/MIS/PAR), historique_poste.
--   - Tous les candidats (candidat) et tout ce qui en dépend : fiche_de_voeux
--     et toutes ses tables de préférences (langues, domaines, régions,
--     hébergement, compétences...), etape (historique d'appels), inscrit_a,
--     connait_la_dcc_par.
--   - Tous les comptes utilisateurs (user_) SAUF ceux de rôle ADMIN ou
--     RECRUTEUR.
--   - Tous les contacts (contact) qui n'ont plus de compte utilisateur après
--     l'étape précédente — donc tous les CM/CZ/MIS/PAR/candidats, en gardant
--     uniquement le(s) contact(s) des comptes Admin/Recruteur conservés.
--   - Les liens conjoint/parent (est_conjoint_de, est_parent_de) : ils ne
--     servent qu'aux contacts candidats, qui disparaissent tous.
--   - Les adresses devenues orphelines (plus aucun contact ne les référence).
--
-- CE QUI N'EST PAS TOUCHÉ (référentiels administrables, volontairement) :
--   pays, région, langue, niveau_langue, durée, domaine, compétences,
--   environnement, hébergement, notoriete_dcc, etat_candidat, etat_poste,
--   etat_opportunite, type_billet_avion, aide_contextuelle, stages (sessions).
--   → Si vous voulez aussi vider les sessions (stages), voir la note à la fin
--     de la PARTIE 2.
--
-- CE QUI N'EST PAS TOUCHÉ NON PLUS : les fichiers déjà uploadés sur le disque
-- (dossier UPLOAD_DIR / pièces jointes). Ce script ne nettoie que la base de
-- données — les fichiers orphelins restent sur le serveur, sans conséquence
-- fonctionnelle (ils ne sont simplement plus référencés).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- PARTIE 1 — APERÇU (ne modifie rien, à lancer et lire en premier)
-- ----------------------------------------------------------------------------

SELECT
  (SELECT count(*) FROM fiche_de_poste) AS postes_a_supprimer,
  (SELECT count(*) FROM candidat)       AS candidats_a_supprimer,
  (SELECT count(*) FROM contact)        AS contacts_actuels,
  (SELECT count(*) FROM user_)          AS comptes_actuels;

-- Les comptes qui seront conservés :
SELECT u.id_user, u.login, u.role_applicatif, u.active,
       c.nom_contact, c.prenom_contact
FROM user_ u
JOIN contact c ON c.id_contact = u.id_contact
WHERE u.role_applicatif IN ('ADMIN', 'RECRUTEUR');

-- Les comptes qui seront supprimés (CM, CANDIDAT, et tout le reste) :
SELECT u.id_user, u.login, u.role_applicatif, u.active,
       c.nom_contact, c.prenom_contact
FROM user_ u
JOIN contact c ON c.id_contact = u.id_contact
WHERE u.role_applicatif NOT IN ('ADMIN', 'RECRUTEUR');

-- ----------------------------------------------------------------------------
-- PARTIE 2 — SUPPRESSION (dans une transaction : COMMIT; ou ROLLBACK; à la fin)
-- ----------------------------------------------------------------------------

BEGIN;

-- 1. Postes et candidats : TRUNCATE ... CASCADE laisse PostgreSQL suivre
--    lui-même toutes les clés étrangères réelles de la base (plus fiable
--    qu'une liste de DELETE manuelle si le schéma a évolué depuis), et vide
--    au passage tout ce qui en dépend : opportunite, criteres_detailles,
--    langue_poste, evolue_dans, recherche, gere_poste, historique_poste,
--    fiche_de_voeux et ses tables de préférences, etape, inscrit_a,
--    connait_la_dcc_par. RESTART IDENTITY relance les compteurs à 1 : les
--    prochains postes/candidats importés repartiront avec des id propres.
TRUNCATE TABLE fiche_de_poste, candidat RESTART IDENTITY CASCADE;

-- 2. Comptes utilisateurs : on garde uniquement Admin et Recruteur.
DELETE FROM user_ WHERE role_applicatif NOT IN ('ADMIN', 'RECRUTEUR');

-- 3. Liens conjoint/parent : plus aucun candidat, donc plus aucune raison
--    d'en garder (ces tables ne servent qu'aux contacts candidats).
DELETE FROM est_conjoint_de;
DELETE FROM est_parent_de;

-- 4. Contacts : on garde uniquement ceux encore rattachés à un compte
--    utilisateur restant (Admin/Recruteur). Tout le reste (CM, CZ, MIS, PAR,
--    candidats) disparaît.
DELETE FROM contact
WHERE id_contact NOT IN (SELECT id_contact FROM user_);

-- 5. Adresses devenues orphelines (plus aucun contact ne les référence) —
--    supprimé après les contacts, jamais avant (contrainte de clé étrangère).
DELETE FROM adresse
WHERE NOT EXISTS (SELECT 1 FROM contact c WHERE c.id_adresse = adresse.id_adresse);

-- Vérification finale : doit montrer 0 poste, 0 candidat, et uniquement des
-- comptes ADMIN/RECRUTEUR.
SELECT
  (SELECT count(*) FROM fiche_de_poste) AS postes_restants,
  (SELECT count(*) FROM candidat)       AS candidats_restants,
  (SELECT count(*) FROM contact)        AS contacts_restants,
  (SELECT count(*) FROM user_)          AS comptes_restants;

SELECT id_user, login, role_applicatif, active FROM user_ ORDER BY id_user;

-- Si vous voulez AUSSI vider les sessions (stages) — décommentez cette ligne
-- avant le COMMIT (inscrit_a a déjà été vidée par le TRUNCATE CASCADE) :
-- DELETE FROM stages;

-- Si le résultat ci-dessus est vide/correct :
-- COMMIT;
-- Sinon :
-- ROLLBACK;
