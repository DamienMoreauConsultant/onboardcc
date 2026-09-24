-- ============================================================================
-- ⚠️ OBSOLÈTE (archivé le 18/09/2026) — NE PLUS UTILISER pour initialiser une
-- base, ni locale ni o2switch.
--
-- Ce fichier était le tout premier jet du schéma + données de démo, jamais
-- mis à jour depuis. Le déploiement o2switch du 08/09/2026 est passé sur une
-- approche différente et plus fiable : un pg_dump --schema-only de la base
-- Replit (déjà à jour de toutes les migrations) + un seed séparé de
-- référentiels validés DCC (seed_referentiels.sql, alors dans le dépôt
-- "Projet Fil Rouge", désormais lui-même archivé — voir ci-dessous). Ce
-- fichier-ci n'a donc plus servi depuis, et a fini par diverger du schéma réel
-- — découvert le 18/09/2026 en tentant de l'utiliser pour recharger une base
-- de dev locale : schéma manquant les 12 migrations (dont role_applicatif,
-- indispensable), competences.crm_key resté en VARCHAR(20) au lieu de
-- VARCHAR(40) (fait échouer l'import de 6 codes de compétences), et données
-- de démo cassées (une adresse sans id_pays résolu).
--
-- Le remplaçant à jour est documentation/prompt_0_sql_versionAvantProd_20260918.sql
-- (dans ce même dépôt de code, déplacé le 18/09/2026 depuis
-- "Projet Fil Rouge"/Documents/3 - BDD/ pour rester synchronisé sur GitHub) —
-- un seul fichier qui combine le dump de schéma cité ci-dessus et les
-- référentiels validés DCC, prêt à charger tel quel sur une base vide.
-- Conservé ici uniquement pour mémoire (traçabilité de l'historique du
-- projet), voir aussi conception.md et l'échange avec Claude du 18/09/2026.
-- ============================================================================

-- ============================================================================
-- PROMPT 0 — Schéma PostgreSQL complet + données de référence
-- Envoyer EN PREMIER à Replit — AVANT tout autre prompt.
-- Ne PAS laisser l'IA générer son propre modèle de données : exécuter ce script tel quel.
-- Source : script Looping (Merise) validé, converti Access -> PostgreSQL, avec les
-- corrections suivantes appliquées (non réalisables dans Looping) :
--   1. UNIQUE(id_fiche_de_voeux, id_poste) ajouté sur opportunite
--   2. "Inscrit_à" renommé "inscrit_a" (bug d'encodage à l'export Looping)
--   3. parle / veut_partir_pour / a_etudie_dans / a_travaille_dans migrées de
--      candidat vers fiche_de_voeux (ces données sont éditables par le candidat
--      au moment des vœux — cohérence avec la politique d'accès "1 table = 1 politique
--      d'édition", conception.md §6.1.1 et §6.3.1)
-- Conventions : COUNTER -> SERIAL, LOGICAL -> BOOLEAN. Noms de table/colonne en
-- snake_case (Postgres replie de toute façon les identifiants non cités en minuscules).
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. RÉFÉRENTIELS SIMPLES
-- ============================================================================

CREATE TABLE langue (
  id_langue     SERIAL PRIMARY KEY,
  crm_key       VARCHAR(20) NOT NULL UNIQUE,
  designation   VARCHAR(50) NOT NULL UNIQUE,
  active        BOOLEAN DEFAULT TRUE
);

CREATE TABLE niveau_langue (
  id_niveau_langue SERIAL PRIMARY KEY,
  designation       VARCHAR(20) NOT NULL UNIQUE,
  ordre             INT NOT NULL UNIQUE
);
-- Décision (item 81) : le candidat garde 2 listes statiques dupliquées (côté
-- fiche_de_voeux/parle et côté langue_poste) plutôt qu'un référentiel partagé.
-- Cette table n'est PAS une contrainte forte (FK) sur parle.niveau / langue_poste.niveau_requis :
-- elle sert uniquement de source pour peupler les 2 listes déroulantes à l'identique,
-- afin d'éviter que "Courant" et "courant " ne soient jamais comparés.

CREATE TABLE region (
  id_region     SERIAL PRIMARY KEY,
  crm_key       VARCHAR(20) NOT NULL UNIQUE,
  designation   VARCHAR(50) NOT NULL UNIQUE,
  active        BOOLEAN DEFAULT TRUE
);

CREATE TABLE pays (
  id_pays       SERIAL PRIMARY KEY,
  crm_key       VARCHAR(20) NOT NULL UNIQUE,
  designation   VARCHAR(50) NOT NULL UNIQUE,
  active        BOOLEAN DEFAULT TRUE,
  id_region     INT NOT NULL REFERENCES region(id_region)
);

CREATE TABLE environnement (
  id_environnement  SERIAL PRIMARY KEY,
  crm_key           VARCHAR(20) NOT NULL UNIQUE,
  designation       VARCHAR(50) NOT NULL UNIQUE,
  niveau            INT,  -- sert au calcul d'écart (scoring §6.4.5)
  active            BOOLEAN DEFAULT TRUE
);

CREATE TABLE duree (
  id_duree      SERIAL PRIMARY KEY,
  crm_key       VARCHAR(20) NOT NULL UNIQUE,
  periode       VARCHAR(50) NOT NULL UNIQUE,
  statut        VARCHAR(50) NOT NULL,  -- Benevolat / VSI
  niveau        DECIMAL(2,1),          -- sert au calcul d'écart (scoring §6.4.5)
  active        BOOLEAN DEFAULT TRUE
);

CREATE TABLE hebergement (
  id_hebergement SERIAL PRIMARY KEY,
  crm_key        VARCHAR(20) NOT NULL UNIQUE,
  designation    VARCHAR(50) NOT NULL UNIQUE,
  active         BOOLEAN DEFAULT TRUE
);

CREATE TABLE domaine (
  id_domaine    SERIAL PRIMARY KEY,
  crm_key       VARCHAR(20) NOT NULL UNIQUE,
  designation   VARCHAR(50),
  active        BOOLEAN DEFAULT TRUE
);

CREATE TABLE competences (
  id_competences SERIAL PRIMARY KEY,
  crm_key        VARCHAR(20) NOT NULL UNIQUE,
  designation    VARCHAR(50) NOT NULL UNIQUE,
  active         BOOLEAN DEFAULT TRUE,
  id_domaine     INT NOT NULL REFERENCES domaine(id_domaine)
);

CREATE TABLE notoriete_dcc (
  id_notoriete_dcc SERIAL PRIMARY KEY,
  designation       VARCHAR(50) NOT NULL UNIQUE
);

-- ============================================================================
-- 2. RÉFÉRENTIELS D'ÉTAT (normalisés — voir conception.md §6.1.4 : plus de codes
--    3 lettres comme valeur AFFICHÉE ; les codes qui subsistent ci-dessous ne
--    servent que de clé technique interne, jamais montrés à l'écran)
-- ============================================================================

CREATE TABLE etat_candidat (
  id_etat_candidat  VARCHAR(20) PRIMARY KEY,   -- ex: 'CRE', 'AP1'... clé technique uniquement
  designation       VARCHAR(50) NOT NULL UNIQUE, -- libellé complet affiché à l'écran
  active            BOOLEAN DEFAULT TRUE,
  delais_de_reponse INT
);

CREATE TABLE etat_poste (
  id_etat_poste SERIAL PRIMARY KEY,
  designation   VARCHAR(50) NOT NULL UNIQUE,
  active        BOOLEAN DEFAULT TRUE
);

CREATE TABLE etat_opportunite (
  id_etat_opportunite SERIAL PRIMARY KEY,
  designation          VARCHAR(50) NOT NULL UNIQUE,
  active               BOOLEAN DEFAULT TRUE
);

-- ============================================================================
-- 3. CONTACT / ADRESSE / UTILISATEUR
-- ============================================================================

CREATE TABLE adresse (
  id_adresse    SERIAL PRIMARY KEY,
  adresse1      VARCHAR(50),
  adresse2      VARCHAR(50),
  code_postal   VARCHAR(50),
  ville         VARCHAR(50),
  id_pays       INT NOT NULL REFERENCES pays(id_pays)
);

CREATE TABLE contact (
  id_contact      SERIAL PRIMARY KEY,
  crm_key         VARCHAR(50) NOT NULL UNIQUE,
  role            VARCHAR(20) NOT NULL,  -- CAN / PAR / MIS / CHZ / CM1 / CM2 -- monovalué (décision validée)
  genre           VARCHAR(20),
  nom_contact     VARCHAR(50),
  nom_naissance   VARCHAR(50),
  prenom_contact  VARCHAR(50),
  tel_contact     VARCHAR(50),
  email_contact   VARCHAR(50),
  date_naissance  DATE,
  lieu_naissance  VARCHAR(50),
  nationalite     VARCHAR(50),
  id_adresse      INT REFERENCES adresse(id_adresse)
);

CREATE TABLE est_conjoint_de (
  id_contact          INT PRIMARY KEY REFERENCES contact(id_contact),
  date_mariage_civil  DATE,
  id_contact_1        INT NOT NULL UNIQUE REFERENCES contact(id_contact)
);

CREATE TABLE est_parent_de (
  id_contact            INT REFERENCES contact(id_contact),
  id_contact_1          INT REFERENCES contact(id_contact),
  pars_en_volontariat   VARCHAR(50),
  PRIMARY KEY (id_contact, id_contact_1)
);

CREATE TABLE user_ (
  id_user     SERIAL PRIMARY KEY,
  login       VARCHAR(50) NOT NULL UNIQUE,
  password    VARCHAR(1000) NOT NULL,  -- hash bcrypt/argon2, JAMAIS en clair
  id_contact  INT NOT NULL UNIQUE REFERENCES contact(id_contact)
);

-- ============================================================================
-- 4. STAGES (SESSIONS CHOISIR)
-- ============================================================================

CREATE TABLE stages (
  id_stages             SERIAL PRIMARY KEY,
  type_stage            VARCHAR(20),
  date_debut            DATE,
  date_fin              DATE,
  active                BOOLEAN DEFAULT TRUE,
  voeux_definitif_ouvert BOOLEAN DEFAULT FALSE
);

-- ============================================================================
-- 5. CANDIDAT / FICHE DE VŒUX / HISTORIQUE
-- ============================================================================

CREATE TABLE candidat (
  id_candidat     SERIAL PRIMARY KEY,
  web_key         VARCHAR(50) UNIQUE,   -- clé de rapprochement avec la BDD site web
  crm_key         VARCHAR(20) UNIQUE,
  trigram_candidat VARCHAR(5),
  engagements     TEXT,
  annonces_recherchees VARCHAR(250),
  perso_depart_en_couple BOOLEAN,
  perso_nom_prenom_conjoint VARCHAR(50),
  perso_etat_de_vie VARCHAR(20),
  perso_date_mariage DATE,
  perso_est_parent BOOLEAN,
  perso_pars_avec_enfants BOOLEAN,
  projet_date_depart_souhaitee DATE,
  projet_numero_offre_mission VARCHAR(50),
  projet_motivations VARCHAR(250),
  projet_questionnements VARCHAR(250),
  projet_avancement VARCHAR(250),
  projet_experience_interculturelle VARCHAR(250),
  projet_formation_dialogue_interculturel VARCHAR(250),
  projet_experience_de_volontariat VARCHAR(250),
  projet_raison_du_depart_avec_la_dcc VARCHAR(250),
  projet_attente_de_la_dcc VARCHAR(250),
  projet_lien_avec_une_autre_structure BOOLEAN,
  projet_lien_avec_une_autre_structure_detail VARCHAR(250),
  profil_statut VARCHAR(20),
  profil_statut_administration_de_tutelle VARCHAR(50),
  profil_experience_engagement BOOLEAN,
  profil_experience_engagement_detail VARCHAR(250),
  candidature_information_du_candidat VARCHAR(250),
  candidature_disponibilite_du_candidat VARCHAR(250),
  candidature_preference_session_choisir VARCHAR(250),
  id_etat_candidat VARCHAR(20) NOT NULL REFERENCES etat_candidat(id_etat_candidat),
  id_contact      INT NOT NULL REFERENCES contact(id_contact)
);
-- NB : experience_professionnelle et formation_academique ont été supprimées
-- (redondantes avec les tables structurées a_etudie_dans / a_travaille_dans).

CREATE TABLE fiche_de_voeux (
  id_fiche_de_voeux      SERIAL PRIMARY KEY,
  flag_create_opportunity BOOLEAN DEFAULT FALSE,
  flag_fiche_de_voeux_soumise BOOLEAN DEFAULT FALSE,
  flag_update_score      BOOLEAN DEFAULT FALSE,
  flag_candidat_deja_mis_en_lien BOOLEAN DEFAULT FALSE,
  date_creation           DATE DEFAULT CURRENT_DATE,
  date_modification       DATE,
  modifie_par             VARCHAR(50),
  part_seul               BOOLEAN,
  zone_orange             BOOLEAN,
  conditions_spartiates   BOOLEAN,
  hopital_proche          BOOLEAN,
  fonctionnaire_dispo_demandee BOOLEAN,
  date_depart_souhaite    DATE,
  nouveau_poste           BOOLEAN,
  nouvelle_langue         BOOLEAN,
  competences_a_developper TEXT,
  centres_interret        TEXT,
  categorie_ecclesiale    VARCHAR(20),
  categorie_ecclesiale_detail VARCHAR(250),
  acces_candidat          BOOLEAN DEFAULT TRUE,
  date_voeux_provisoires  DATE,
  date_voeux_definitifs   DATE,
  -- ⚠️ Point ouvert (§6.3.7) : colonnes de verrouillage de soumission
  -- (validateur + date de verrouillage) à ajouter dès que le mécanisme sera confirmé.
  id_candidat             INT NOT NULL UNIQUE REFERENCES candidat(id_candidat)
);

CREATE TABLE etape (
  id_historique     SERIAL PRIMARY KEY,
  acteur            VARCHAR(50),
  date_evenement    DATE DEFAULT CURRENT_DATE,
  score             INT,
  note_ecrite       TEXT,
  pj_description    VARCHAR(50),
  url1_piece_jointe VARCHAR(250),
  url2_piece_jointe VARCHAR(250),
  id_etat_candidat  VARCHAR(20) NOT NULL REFERENCES etat_candidat(id_etat_candidat),
  id_candidat       INT NOT NULL REFERENCES candidat(id_candidat)
);

CREATE TABLE inscrit_a (
  id_fiche_de_voeux INT REFERENCES fiche_de_voeux(id_fiche_de_voeux),
  id_stages         INT REFERENCES stages(id_stages),
  PRIMARY KEY (id_fiche_de_voeux, id_stages)
);

-- ============================================================================
-- 6. FICHE DE POSTE
-- ============================================================================

CREATE TABLE fiche_de_poste (
  id_poste          SERIAL PRIMARY KEY,
  crm_key           VARCHAR(20) NOT NULL UNIQUE,
  flag_create_opportunity BOOLEAN DEFAULT FALSE,
  flag_update_score BOOLEAN DEFAULT FALSE,
  flag_poste_deja_mis_en_lien BOOLEAN DEFAULT FALSE,
  statut_volontaire VARCHAR(20),
  ong               VARCHAR(50),
  candidat_preaffecte BOOLEAN NOT NULL DEFAULT FALSE,
  nom_candidat      VARCHAR(50),
  fonction          VARCHAR(100),
  date_demande      DATE,
  priorite          VARCHAR(20),
  billet_avion      BOOLEAN,
  indemnite_mensuelle_partenaire INT,
  indemnite_mensuelle_dcc INT,
  gite_et_couvert   VARCHAR(50),
  hebergement_detail TEXT,
  date_arrivee_souhaitee DATE,
  preference_genre  VARCHAR(50),
  deuxieme_poste_possible_partenaire BOOLEAN,
  deuxieme_poste_possible_alentour BOOLEAN,
  nouveau_poste     BOOLEAN,
  nom_ancien_volontaire VARCHAR(50),
  odd_lie           VARCHAR(50),
  contexte_mission  TEXT,
  objectifs_mission TEXT,
  taches            TEXT,
  competences_detail TEXT,
  dimension_ecclesial TEXT,
  flag_zone_orange  BOOLEAN,
  flag_condition_spartiates BOOLEAN,
  flag_hopital_proche BOOLEAN,
  id_etat_poste     INT NOT NULL REFERENCES etat_poste(id_etat_poste),
  id_pays           INT NOT NULL REFERENCES pays(id_pays),
  id_hebergement    INT NOT NULL REFERENCES hebergement(id_hebergement),
  id_duree          INT NOT NULL REFERENCES duree(id_duree),
  id_domaine        INT NOT NULL REFERENCES domaine(id_domaine)
);

CREATE TABLE langue_poste (
  id_poste      INT PRIMARY KEY REFERENCES fiche_de_poste(id_poste),
  niveau_requis VARCHAR(20),
  id_langue     INT NOT NULL REFERENCES langue(id_langue)
);

-- ============================================================================
-- 7. OPPORTUNITÉ + DÉTAIL DE SCORING
-- ============================================================================

CREATE TABLE opportunite (
  id_opportunite    SERIAL PRIMARY KEY,
  flag_opportunite_proposee_a_cm BOOLEAN DEFAULT FALSE,
  flag_opportunite_retenue BOOLEAN DEFAULT FALSE,
  flag_opportunite_non_retenu BOOLEAN DEFAULT FALSE,
  note_contexte     DECIMAL(4,2),
  note_mission      DECIMAL(4,2),
  note_warning      DECIMAL(4,2),
  appreciation_recruteur VARCHAR(100),
  commentaire_charge_mission VARCHAR(100),
  id_etat_opportunite INT NOT NULL REFERENCES etat_opportunite(id_etat_opportunite),
  id_poste          INT NOT NULL REFERENCES fiche_de_poste(id_poste),
  id_fiche_de_voeux INT NOT NULL REFERENCES fiche_de_voeux(id_fiche_de_voeux),
  UNIQUE (id_fiche_de_voeux, id_poste)  -- ⚠️ Correction appliquée : garantit "1 seule opportunité par couple candidat-poste"
);

CREATE TABLE criteres_detailles (
  id_criteres_detailles SERIAL PRIMARY KEY,
  date_evaluation   DATE DEFAULT CURRENT_DATE,
  critere           VARCHAR(50),
  valeur_poste      VARCHAR(50),
  valeur_candidat   VARCHAR(50),
  note_obtenue      DECIMAL(4,2),
  id_opportunite    INT NOT NULL REFERENCES opportunite(id_opportunite)
);

-- ============================================================================
-- 8. RELATIONS N:N — FICHE DE VŒUX (critères candidat)
-- ============================================================================

-- Migrées depuis candidat vers fiche_de_voeux (correction appliquée, voir en-tête) :
CREATE TABLE parle (
  id_fiche_de_voeux INT REFERENCES fiche_de_voeux(id_fiche_de_voeux),
  id_langue         INT REFERENCES langue(id_langue),
  niveau            VARCHAR(20),
  autre_langue      VARCHAR(50),
  PRIMARY KEY (id_fiche_de_voeux, id_langue)
);

CREATE TABLE veut_partir_pour (
  id_fiche_de_voeux INT REFERENCES fiche_de_voeux(id_fiche_de_voeux),
  id_duree          INT REFERENCES duree(id_duree),
  projet_duree_specifique VARCHAR(50),
  PRIMARY KEY (id_fiche_de_voeux, id_duree)
);

CREATE TABLE a_etudie_dans (
  id_fiche_de_voeux INT REFERENCES fiche_de_voeux(id_fiche_de_voeux),
  id_domaine        INT REFERENCES domaine(id_domaine),
  PRIMARY KEY (id_fiche_de_voeux, id_domaine)
);

CREATE TABLE a_travaille_dans (
  id_fiche_de_voeux INT REFERENCES fiche_de_voeux(id_fiche_de_voeux),
  id_domaine        INT REFERENCES domaine(id_domaine),
  PRIMARY KEY (id_fiche_de_voeux, id_domaine)
);

-- Inchangées :
CREATE TABLE veut_vivre_dans (
  id_fiche_de_voeux INT REFERENCES fiche_de_voeux(id_fiche_de_voeux),
  id_environnement  INT REFERENCES environnement(id_environnement),
  PRIMARY KEY (id_fiche_de_voeux, id_environnement)
);

CREATE TABLE veut_aller_a (
  id_fiche_de_voeux INT REFERENCES fiche_de_voeux(id_fiche_de_voeux),
  id_region         INT REFERENCES region(id_region),
  degre             VARCHAR(20),  -- "veut aller" / "ne veut pas aller" / neutre — scoring §6.4.5
  PRIMARY KEY (id_fiche_de_voeux, id_region)
);

CREATE TABLE veut_habiter_dans (
  id_fiche_de_voeux INT REFERENCES fiche_de_voeux(id_fiche_de_voeux),
  id_hebergement    INT REFERENCES hebergement(id_hebergement),
  PRIMARY KEY (id_fiche_de_voeux, id_hebergement)
);

CREATE TABLE a_la_competence_de (
  id_fiche_de_voeux INT REFERENCES fiche_de_voeux(id_fiche_de_voeux),
  id_competences    INT REFERENCES competences(id_competences),
  niveau            VARCHAR(20),
  autre_competence  VARCHAR(50),
  PRIMARY KEY (id_fiche_de_voeux, id_competences)
);

CREATE TABLE connait_la_dcc_par (
  id_candidat       INT REFERENCES candidat(id_candidat),
  id_notoriete_dcc  INT REFERENCES notoriete_dcc(id_notoriete_dcc),
  autre_designation VARCHAR(50),
  detail            VARCHAR(50),
  PRIMARY KEY (id_candidat, id_notoriete_dcc)
);

-- ============================================================================
-- 9. RELATIONS N:N — FICHE DE POSTE
-- ============================================================================

CREATE TABLE evolue_dans (
  id_environnement INT REFERENCES environnement(id_environnement),
  id_poste         INT REFERENCES fiche_de_poste(id_poste),
  PRIMARY KEY (id_environnement, id_poste)
);

CREATE TABLE recherche (
  id_competences INT REFERENCES competences(id_competences),
  id_poste       INT REFERENCES fiche_de_poste(id_poste),
  PRIMARY KEY (id_competences, id_poste)
);

CREATE TABLE gere_poste (
  id_contact INT REFERENCES contact(id_contact),
  id_poste   INT REFERENCES fiche_de_poste(id_poste),
  PRIMARY KEY (id_contact, id_poste)
);

COMMIT;

-- ============================================================================
-- 10. DONNÉES DE RÉFÉRENCE
-- ============================================================================

BEGIN;

-- --- Régions (item 7) ---
INSERT INTO region (crm_key, designation, active) VALUES
  ('AFS', 'Afrique subsaharienne', TRUE),
  ('MAD', 'Madagascar', TRUE),
  ('PRO', 'Proche-Orient', TRUE),
  ('MAG', 'Maghreb', TRUE),
  ('ASP', 'Asie / Pacifique', TRUE),
  ('AML', 'Amérique latine et Caraïbes', TRUE);

-- --- Pays (item 8) — liste représentative par région, à valider avec la DCC ---
INSERT INTO pays (crm_key, designation, active, id_region) VALUES
  ('SENEGAL', 'Sénégal', TRUE, (SELECT id_region FROM region WHERE crm_key='AFS')),
  ('BENIN', 'Bénin', TRUE, (SELECT id_region FROM region WHERE crm_key='AFS')),
  ('CAMEROUN', 'Cameroun', TRUE, (SELECT id_region FROM region WHERE crm_key='AFS')),
  ('COTE_IVOIRE', 'Côte d''Ivoire', TRUE, (SELECT id_region FROM region WHERE crm_key='AFS')),
  ('RDCONGO', 'République Démocratique du Congo', TRUE, (SELECT id_region FROM region WHERE crm_key='AFS')),
  ('TOGO', 'Togo', TRUE, (SELECT id_region FROM region WHERE crm_key='AFS')),
  ('MADAGASCAR', 'Madagascar', TRUE, (SELECT id_region FROM region WHERE crm_key='MAD')),
  ('LIBAN', 'Liban', TRUE, (SELECT id_region FROM region WHERE crm_key='PRO')),
  ('JORDANIE', 'Jordanie', TRUE, (SELECT id_region FROM region WHERE crm_key='PRO')),
  ('MAROC', 'Maroc', TRUE, (SELECT id_region FROM region WHERE crm_key='MAG')),
  ('TUNISIE', 'Tunisie', TRUE, (SELECT id_region FROM region WHERE crm_key='MAG')),
  ('ALGERIE', 'Algérie', TRUE, (SELECT id_region FROM region WHERE crm_key='MAG')),
  ('VIETNAM', 'Vietnam', TRUE, (SELECT id_region FROM region WHERE crm_key='ASP')),
  ('CAMBODGE', 'Cambodge', TRUE, (SELECT id_region FROM region WHERE crm_key='ASP')),
  ('PHILIPPINES', 'Philippines', TRUE, (SELECT id_region FROM region WHERE crm_key='ASP')),
  ('PEROU', 'Pérou', TRUE, (SELECT id_region FROM region WHERE crm_key='AML')),
  ('BOLIVIE', 'Bolivie', TRUE, (SELECT id_region FROM region WHERE crm_key='AML')),
  ('HAITI', 'Haïti', TRUE, (SELECT id_region FROM region WHERE crm_key='AML'));
-- ⚠️ Point ouvert : liste à recouper avec les postes réels du futur export CRM.

-- --- Environnement (item 9) — niveau = rang pour le calcul d'écart (§6.4.5) ---
INSERT INTO environnement (crm_key, designation, niveau, active) VALUES
  ('UGV', 'Urbain, grande ville', 1, TRUE),
  ('UPV', 'Urbain petite ville', 2, TRUE),
  ('RPV', 'Rural proche de ville', 3, TRUE),
  ('RUI', 'Rural isolé', 4, TRUE);

-- --- Hébergement (item 10) ---
INSERT INTO hebergement (crm_key, designation, active) VALUES
  ('LOS', 'Logement seul', TRUE),
  ('COL', 'Colocation', TRUE),
  ('VCR', 'Vie avec communauté religieuse', TRUE);

-- --- Durée mission (item 12) — niveau = rang pour le calcul d'écart (§6.4.5) ---
INSERT INTO duree (crm_key, periode, statut, niveau, active) VALUES
  ('11M', 'jusqu''à 11 mois', 'Benevolat', 1, TRUE),
  ('1AN', '1 an', 'VSI', 2, TRUE),
  ('2AN', '2 ans', 'VSI', 3, TRUE),
  ('1A+', '1 an renouvelable', 'VSI', 2.5, TRUE);

-- --- Langue (item 13) ---
INSERT INTO langue (crm_key, designation, active) VALUES
  ('FR', 'Français', TRUE),
  ('ANG', 'Anglais', TRUE),
  ('ESP', 'Espagnol', TRUE),
  ('POR', 'Portugais', TRUE);

INSERT INTO niveau_langue (designation, ordre) VALUES
  ('Notions', 1), ('Parlé', 2), ('Courant', 3), ('Bilingue', 4);

-- --- Domaines et compétences (item 11 — source : "Feuille de vœux pour refonte.pdf") ---
INSERT INTO domaine (crm_key, designation, active) VALUES
  ('PRIMAIRE_FORMATION', 'Primaire / formation', TRUE),
  ('SANTE', 'Santé', TRUE),
  ('LITTERAIRE_LANGUES', 'Littéraire / langues', TRUE),
  ('INGENIEUR_TECHNIQUE', 'Ingénieur / technique', TRUE),
  ('GESTION_PROJET', 'Gestion de projet', TRUE),
  ('SCIENCES_INFO', 'Sciences / informatique', TRUE),
  ('RURAL', 'Rural', TRUE),
  ('ECO_SC_HUM_JURIDIQUE', 'Économie / Sc. Humaines / Juridique', TRUE),
  ('COM_MEDIAS', 'Com / médias', TRUE),
  ('ANIMATION_SOCIOEDUC', 'Animation socio-éducative', TRUE);

INSERT INTO competences (crm_key, designation, active, id_domaine) VALUES
  ('SOUTIEN_SCOLAIRE', 'Soutien scolaire', TRUE, (SELECT id_domaine FROM domaine WHERE crm_key='PRIMAIRE_FORMATION')),
  ('ENS_PRIMAIRE', 'Enseignement primaire', TRUE, (SELECT id_domaine FROM domaine WHERE crm_key='PRIMAIRE_FORMATION')),
  ('DIRECTION_ECOLE', 'Direction d''école', TRUE, (SELECT id_domaine FROM domaine WHERE crm_key='PRIMAIRE_FORMATION')),
  ('CONSEIL_PEDAGOGIQUE', 'Conseil pédagogique', TRUE, (SELECT id_domaine FROM domaine WHERE crm_key='PRIMAIRE_FORMATION')),
  ('SOINS', 'Soins', TRUE, (SELECT id_domaine FROM domaine WHERE crm_key='SANTE')),
  ('FORMATION_SANTE', 'Formation', TRUE, (SELECT id_domaine FROM domaine WHERE crm_key='SANTE')),
  ('COORDINATION_CENTRE', 'Coordination d''un centre', TRUE, (SELECT id_domaine FROM domaine WHERE crm_key='SANTE')),
  ('ENS_SECONDAIRE_LANGUES', 'Enseignement secondaire', TRUE, (SELECT id_domaine FROM domaine WHERE crm_key='LITTERAIRE_LANGUES')),
  ('ENS_UNIVERSITAIRE_LANGUES', 'Enseignement universitaire', TRUE, (SELECT id_domaine FROM domaine WHERE crm_key='LITTERAIRE_LANGUES')),
  ('ANIMATION_CULTURELLE', 'Animation culturelle / bibliothèque', TRUE, (SELECT id_domaine FROM domaine WHERE crm_key='LITTERAIRE_LANGUES')),
  ('CONSTRUCTION', 'Construction', TRUE, (SELECT id_domaine FROM domaine WHERE crm_key='INGENIEUR_TECHNIQUE')),
  ('ENS_TECHNIQUE', 'Enseignement technique', TRUE, (SELECT id_domaine FROM domaine WHERE crm_key='INGENIEUR_TECHNIQUE')),
  ('TECHNICIEN', 'Technicien', TRUE, (SELECT id_domaine FROM domaine WHERE crm_key='INGENIEUR_TECHNIQUE')),
  ('DIRECTION', 'Direction', TRUE, (SELECT id_domaine FROM domaine WHERE crm_key='GESTION_PROJET')),
  ('MANAGEMENT_EQUIPE', 'Management d''équipe', TRUE, (SELECT id_domaine FROM domaine WHERE crm_key='GESTION_PROJET')),
  ('RECHERCHE_FONDS', 'Recherche de fonds', TRUE, (SELECT id_domaine FROM domaine WHERE crm_key='GESTION_PROJET')),
  ('COMMERCIAL_MARKETING', 'Commercial, marketing', TRUE, (SELECT id_domaine FROM domaine WHERE crm_key='GESTION_PROJET')),
  ('COMPTA_FINANCES', 'Comptabilité, finances', TRUE, (SELECT id_domaine FROM domaine WHERE crm_key='GESTION_PROJET')),
  ('ADMIN_SECRETARIAT', 'Administratif, secrétariat', TRUE, (SELECT id_domaine FROM domaine WHERE crm_key='GESTION_PROJET')),
  ('ENSEIGNEMENT_GESTION', 'Enseignement', TRUE, (SELECT id_domaine FROM domaine WHERE crm_key='GESTION_PROJET')),
  ('ENS_SECONDAIRE_SCI', 'Enseignement secondaire', TRUE, (SELECT id_domaine FROM domaine WHERE crm_key='SCIENCES_INFO')),
  ('ENS_UNIVERSITAIRE_SCI', 'Enseignement universitaire', TRUE, (SELECT id_domaine FROM domaine WHERE crm_key='SCIENCES_INFO')),
  ('TECHNICIEN_INFO', 'Technicien informatique', TRUE, (SELECT id_domaine FROM domaine WHERE crm_key='SCIENCES_INFO')),
  ('LOGICIEL_SPECIFIQUE', 'Maîtrise logiciel(s) spécifique(s)', TRUE, (SELECT id_domaine FROM domaine WHERE crm_key='SCIENCES_INFO')),
  ('AGRICULTURE', 'Agriculture', TRUE, (SELECT id_domaine FROM domaine WHERE crm_key='RURAL')),
  ('HYDRAULIQUE', 'Hydraulique', TRUE, (SELECT id_domaine FROM domaine WHERE crm_key='RURAL')),
  ('ENS_AGRICOLE', 'Enseignement agricole', TRUE, (SELECT id_domaine FROM domaine WHERE crm_key='RURAL')),
  ('ENSEIGNEMENT_ECO', 'Enseignement', TRUE, (SELECT id_domaine FROM domaine WHERE crm_key='ECO_SC_HUM_JURIDIQUE')),
  ('JURIDIQUE', 'Juridique', TRUE, (SELECT id_domaine FROM domaine WHERE crm_key='ECO_SC_HUM_JURIDIQUE')),
  ('FORMATION_COM', 'Formation, enseignement', TRUE, (SELECT id_domaine FROM domaine WHERE crm_key='COM_MEDIAS')),
  ('COMMUNICATION', 'Communication', TRUE, (SELECT id_domaine FROM domaine WHERE crm_key='COM_MEDIAS')),
  ('TECHNICIEN_AUDIOVIDEO', 'Technicien audio/vidéo', TRUE, (SELECT id_domaine FROM domaine WHERE crm_key='COM_MEDIAS')),
  ('ANIMATION_PASTORALE', 'Animation pastorale', TRUE, (SELECT id_domaine FROM domaine WHERE crm_key='ANIMATION_SOCIOEDUC')),
  ('PROMOTION_FEMININE', 'Promotion féminine', TRUE, (SELECT id_domaine FROM domaine WHERE crm_key='ANIMATION_SOCIOEDUC')),
  ('PERSONNES_HANDICAPEES', 'Personnes handicapées', TRUE, (SELECT id_domaine FROM domaine WHERE crm_key='ANIMATION_SOCIOEDUC')),
  ('JEUNES', 'Jeunes', TRUE, (SELECT id_domaine FROM domaine WHERE crm_key='ANIMATION_SOCIOEDUC')),
  ('EDUCATION_SPECIALISEE', 'Éducation spécialisée', TRUE, (SELECT id_domaine FROM domaine WHERE crm_key='ANIMATION_SOCIOEDUC')),
  ('PERSONNES_AGEES', 'Personnes âgées', TRUE, (SELECT id_domaine FROM domaine WHERE crm_key='ANIMATION_SOCIOEDUC'));

-- --- Référentiel etat_poste (item 17) ---
INSERT INTO etat_poste (designation, active) VALUES
  ('À pourvoir', TRUE),
  ('Pré-affecté', TRUE),
  ('Pré-réservé', TRUE),
  ('Réservé', TRUE),
  ('Pourvu', TRUE),
  ('Fermé', TRUE);

-- --- Référentiel etat_candidat (item 37) — codes techniques conservés en clé, jamais affichés ---
INSERT INTO etat_candidat (id_etat_candidat, designation, active, delais_de_reponse) VALUES
  ('CRE', 'Candidat créé', TRUE, 7),
  ('NEL', 'Non éligible', TRUE, NULL),
  ('AP1', '1er appel téléphonique', TRUE, 14),
  ('AP2', '2ème appel téléphonique', TRUE, 21),
  ('CHO', 'Session choisir', TRUE, 14),
  ('NCA', 'Non candidat', TRUE, NULL),
  ('ATA', 'Attente affectation', TRUE, 30),
  ('MEL', 'Mis en lien', TRUE, 14),
  ('ACP', 'Accord de principe', TRUE, 14),
  ('ACC', 'Accepté', TRUE, 14),
  ('AFF', 'Affecté', TRUE, NULL);

-- --- Référentiel etat_opportunite (§6.4.1) ---
INSERT INTO etat_opportunite (designation, active) VALUES
  ('Provisoire', TRUE),
  ('Non qualifié', TRUE),
  ('Rejeté système', TRUE),
  ('Proposée au CM', TRUE),
  ('Approuvé CM', TRUE),
  ('Mise en lien', TRUE),
  ('Accord de principe', TRUE),
  ('Accepté', TRUE),
  ('Affecté', TRUE),
  ('Rejeté recruteur', TRUE),
  ('Rejeté CM', TRUE),
  ('Refus candidat', TRUE),
  ('Refus partenaire', TRUE),
  ('Obsolète', TRUE);

COMMIT;

-- ============================================================================
-- 11. DONNÉES DE TEST — CONTACTS (item 14)
-- ============================================================================

BEGIN;

-- --- Chargés de Mission (rôle CM1/CM2) + Chargé de zone (CHZ) + comptes utilisateurs ---
INSERT INTO contact (crm_key, role, genre, nom_contact, prenom_contact, tel_contact, email_contact) VALUES
  ('CM_LOIC', 'CM1', 'M', 'Dupont', 'Loïc', '0601020304', 'loic.dupont@ladcc.org'),
  ('CM_MARIE', 'CM2', 'F', 'Nguyen', 'Marie', '0601020305', 'marie.nguyen@ladcc.org'),
  ('CHZ_PIERRE', 'CHZ', 'M', 'Martin', 'Pierre', '0601020306', 'pierre.martin@ladcc.org');

INSERT INTO user_ (login, password, id_contact) VALUES
  ('loic.dupont', '$2b$12$CHANGEME_HASH_BCRYPT_1', (SELECT id_contact FROM contact WHERE crm_key='CM_LOIC')),
  ('marie.nguyen', '$2b$12$CHANGEME_HASH_BCRYPT_2', (SELECT id_contact FROM contact WHERE crm_key='CM_MARIE')),
  ('pierre.martin', '$2b$12$CHANGEME_HASH_BCRYPT_3', (SELECT id_contact FROM contact WHERE crm_key='CHZ_PIERRE'));
-- ⚠️ Remplacer les hash 'CHANGEME' par de vrais hash bcrypt générés au démarrage du backend
-- (voir prompt1, script de seed) — mot de passe de test suggéré : "DccTest2026!"

-- --- Contacts mission (rôle MIS) + Partenaires (rôle PAR), avec adresses fictives ---
INSERT INTO adresse (adresse1, code_postal, ville, id_pays) VALUES
  ('12 rue de la Mission', '10000', 'Dakar', (SELECT id_pays FROM pays WHERE crm_key='SENEGAL')),
  ('45 avenue des Partenaires', '20000', 'Cotonou', (SELECT id_pays FROM pays WHERE crm_key='BENIN')),
  ('8 rue Centrale', '30000', 'Antananarivo', (SELECT id_pays FROM pays WHERE crm_key='MADAGASCAR'));

INSERT INTO contact (crm_key, role, genre, nom_contact, prenom_contact, tel_contact, email_contact, id_adresse) VALUES
  ('MIS_SENEGAL', 'MIS', 'F', 'Diop', 'Aïssatou', '00221770000001', 'contact@mission-senegal.org', (SELECT id_adresse FROM adresse WHERE ville='Dakar')),
  ('PAR_SENEGAL', 'PAR', 'M', 'Fall', 'Ousmane', '00221770000002', 'ousmane.fall@petites-soeurs-afrique.org', (SELECT id_adresse FROM adresse WHERE ville='Dakar')),
  ('MIS_BENIN', 'MIS', 'M', 'Kone', 'Jean', '0022997000001', 'contact@mission-benin.org', (SELECT id_adresse FROM adresse WHERE ville='Cotonou')),
  ('PAR_BENIN', 'PAR', 'F', 'Adjovi', 'Rose', '0022997000002', 'rose.adjovi@partenaire-benin.org', (SELECT id_adresse FROM adresse WHERE ville='Cotonou')),
  ('PAR_MADAGASCAR', 'PAR', 'M', 'Rakoto', 'Hery', '00261320000001', 'hery.rakoto@partenaire-mada.org', (SELECT id_adresse FROM adresse WHERE ville='Antananarivo'));

COMMIT;

-- ============================================================================
-- 12. DONNÉES DE TEST — 10 CANDIDATS (item 51)
-- ============================================================================
-- Décision (feedback candidat) : nouveaux candidats de test, pas de reprise du jeu Bolt.
-- Répartis volontairement sur plusieurs états pour permettre de tester tous les boutons
-- d'action (§6.3.4) dès la mise en route du prototype.

BEGIN;

INSERT INTO contact (crm_key, role, genre, nom_contact, prenom_contact, tel_contact, email_contact, date_naissance, nationalite) VALUES
  ('TEST_CAN_01', 'CAN', 'F', 'Bernard', 'Camille', '0601000001', 'camille.bernard@test.fr', '1990-03-12', 'Française'),
  ('TEST_CAN_02', 'CAN', 'M', 'Petit', 'Thomas', '0601000002', 'thomas.petit@test.fr', '1985-07-22', 'Française'),
  ('TEST_CAN_03', 'CAN', 'F', 'Durand', 'Léa', '0601000003', 'lea.durand@test.fr', '1993-11-05', 'Française'),
  ('TEST_CAN_04', 'CAN', 'M', 'Moreau', 'Antoine', '0601000004', 'antoine.moreau@test.fr', '1988-01-30', 'Française'),
  ('TEST_CAN_05', 'CAN', 'F', 'Simon', 'Julie', '0601000005', 'julie.simon@test.fr', '1995-05-18', 'Française'),
  ('TEST_CAN_06', 'CAN', 'M', 'Laurent', 'Nicolas', '0601000006', 'nicolas.laurent@test.fr', '1991-09-09', 'Française'),
  ('TEST_CAN_07', 'CAN', 'F', 'Michel', 'Sophie', '0601000007', 'sophie.michel@test.fr', '1987-12-25', 'Française'),
  ('TEST_CAN_08', 'CAN', 'M', 'Garcia', 'Paul', '0601000008', 'paul.garcia@test.fr', '1992-04-14', 'Française'),
  ('TEST_CAN_09', 'CAN', 'F', 'David', 'Anne', '0601000009', 'anne.david@test.fr', '1994-08-08', 'Française'),
  ('TEST_CAN_10', 'CAN', 'M', 'Roux', 'Lucas', '0601000010', 'lucas.roux@test.fr', '1989-06-27', 'Française');

INSERT INTO candidat (crm_key, trigram_candidat, id_etat_candidat, id_contact) VALUES
  ('TEST_CAN_01', 'CBE', 'CRE', (SELECT id_contact FROM contact WHERE crm_key='TEST_CAN_01')),
  ('TEST_CAN_02', 'TPE', 'AP1', (SELECT id_contact FROM contact WHERE crm_key='TEST_CAN_02')),
  ('TEST_CAN_03', 'LDU', 'AP1', (SELECT id_contact FROM contact WHERE crm_key='TEST_CAN_03')),
  ('TEST_CAN_04', 'AMO', 'AP2', (SELECT id_contact FROM contact WHERE crm_key='TEST_CAN_04')),
  ('TEST_CAN_05', 'JSI', 'AP2', (SELECT id_contact FROM contact WHERE crm_key='TEST_CAN_05')),
  ('TEST_CAN_06', 'NLA', 'CHO', (SELECT id_contact FROM contact WHERE crm_key='TEST_CAN_06')),
  ('TEST_CAN_07', 'SMI', 'ATA', (SELECT id_contact FROM contact WHERE crm_key='TEST_CAN_07')),
  ('TEST_CAN_08', 'PGA', 'MEL', (SELECT id_contact FROM contact WHERE crm_key='TEST_CAN_08')),
  ('TEST_CAN_09', 'ADA', 'NEL', (SELECT id_contact FROM contact WHERE crm_key='TEST_CAN_09')),
  ('TEST_CAN_10', 'LRO', 'AFF', (SELECT id_contact FROM contact WHERE crm_key='TEST_CAN_10'));

-- Comptes user_ pour les candidats déjà passés l'étape 2 (AP2 et au-delà, cf. RP-07b §6.3.3)
INSERT INTO user_ (login, password, id_contact)
SELECT c.email_contact, '$2b$12$CHANGEME_HASH_BCRYPT_CAN', c.id_contact
FROM contact c
JOIN candidat ca ON ca.id_contact = c.id_contact
WHERE ca.crm_key IN ('TEST_CAN_04','TEST_CAN_05','TEST_CAN_06','TEST_CAN_07','TEST_CAN_08','TEST_CAN_10');

-- Fiche de vœux pour les candidats en AP2 et au-delà (1,1 côté fiche_de_voeux)
INSERT INTO fiche_de_voeux (part_seul, zone_orange, conditions_spartiates, hopital_proche, date_depart_souhaite, id_candidat)
SELECT TRUE, FALSE, FALSE, FALSE, CURRENT_DATE + INTERVAL '6 months', ca.id_candidat
FROM candidat ca
WHERE ca.crm_key IN ('TEST_CAN_04','TEST_CAN_05','TEST_CAN_06','TEST_CAN_07','TEST_CAN_08','TEST_CAN_10');

COMMIT;

-- ============================================================================
-- FIN DU SCRIPT — vérifications de cohérence recommandées après exécution :
--   SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';
--   -- doit retourner 35 tables
-- ============================================================================
