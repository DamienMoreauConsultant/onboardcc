-- ============================================================================
-- prompt_0_sql_versionAvantProd_20260918.sql
-- Script UNIQUE d'initialisation d'une base Passerelle vide : schéma complet
-- (toutes tables + toutes migrations déjà appliquées) + référentiels validés
-- DCC. Rien d'autre (pas de candidat/poste/compte de démonstration).
--
-- Déplacé le 18/09/2026 de Projet Fil Rouge/Documents/3 - BDD/ vers ici
-- (Passerelle_code/documentation/), à la demande de Damien : pendant le MVP
-- initial, un seul fichier fait foi (pas de différentiel, pas de données de
-- prod à préserver), et il doit vivre dans le dépôt de code pour être
-- synchronisé sur GitHub avec le reste. Documents/3 - BDD/seed_referentiels.sql
-- (dont le contenu référentiel est intégralement repris ci-dessous, PARTIE 2)
-- est archivé dans Documents/3 - BDD/backup/ du dépôt "Projet Fil Rouge" — ne
-- plus le maintenir séparément. À mettre à jour ici à chaque changement
-- impactant la base de données constaté en cours de test (schéma ou
-- référentiel), pour que ce fichier reste la source unique et à jour.
--
-- 18/09/2026 — correction retour DCC : Égypte rattachée à Proche-Orient
-- (au lieu de Maghreb) dans la PARTIE 2 ci-dessous.
--
-- 19/09/2026 — migration 015_criteres_detailles_text.sql intégrée : colonnes
-- criteres_detailles.valeur_poste/valeur_candidat élargies de VARCHAR(50) à TEXT
-- (perte de données silencieuse constatée sur le critère "Compétences", retour
-- de test Damien Retour_09).
--
-- 19/09/2026 — migration 016_criteres_detailles_upsert.sql intégrée : contrainte
-- UNIQUE (id_opportunite, critere) ajoutée sur criteres_detailles, pour permettre
-- un UPSERT (une seule ligne par critère, mise à jour à chaque recalcul plutôt
-- qu'accumulée) — retour de test Damien Retour_10.
--
-- 19-20/09/2026 — migration 017_opportunite_historique.sql intégrée : colonnes
-- opportunite.appreciation_recruteur / commentaire_charge_mission supprimées
-- (réécrites à chaque étape, donc perdant l'historique — commentaires mélangés
-- entre deux opportunités différentes d'un même candidat), remplacées par une
-- seule colonne opportunite.historique (JSONB), enrichie à chaque transition —
-- retour de test Damien Retour_19.
--
-- 24/09/2026 — migration 019_adresse_pays_texte.sql intégrée : adresse.id_pays (clé étrangère
-- vers le référentiel pays, NOT NULL) remplacé par adresse.pays VARCHAR(50), texte importé tel
-- quel. Le référentiel pays ne contient plus que les pays de mission — retour de test Damien
-- Retour_29 (les adresses des candidats et des contacts MIS/PAR peuvent être dans n'importe quel
-- pays du monde).
--
-- 23/09/2026 — migration 018_aide_contextuelle_voeux_texte.sql intégrée : les 23
-- lignes aide_contextuelle de la fiche de vœux (créées par la migration 010 avec
-- un texte de test 'blabla_01'...'blabla_23') n'avaient jamais été reportées dans
-- ce script — absentes sur toute base réinitialisée depuis ce fichier, alors que
-- les 12 lignes de scoring (migration 011) l'étaient déjà. Les 23 lignes sont
-- maintenant présentes ci-dessous avec leur texte définitif — retour de test
-- Damien Retour_23.
--
-- Composition (créé le 18/09/2026, à la demande de Damien) :
--   1. Schéma complet : repris tel quel de
--      Passerelle_code/onboardcc/backups/schema_only_20260908_101006.sql —
--      un pg_dump --schema-only de la base Replit du 08/09/2026, c'est-à-dire
--      APRÈS que les 12 migrations (003_candidate_module.sql à
--      014_role_applicatif.sql) aient déjà été appliquées là-bas. Vérifié
--      colonne par colonne le 18/09/2026 : les marqueurs des 12 migrations
--      sont bien tous présents (role_applicatif + contrainte
--      chk_role_applicatif, type_billet_avion, aide_contextuelle,
--      flag_opportunite_obsolete, date_dernier_recalcul_score...), y compris
--      competences.crm_key déjà en VARCHAR(40) (pas VARCHAR(20)).
--      Seules les 2 lignes \restrict / \unrestrict ont été retirées (marqueurs
--      de sécurité `pg_dump` récents que le client psql 16 local ne reconnaît
--      pas forcément — sans effet sur le contenu du schéma).
--   2. Référentiels : repris tel quel de
--      Documents/3 - BDD/seed_referentiels.sql — le référentiel validé DCC
--      (pas les données de dev), déjà utilisé avec succès sur o2switch le
--      08/09/2026 (15 tables, COMMIT confirmé).
--
-- Pourquoi ce fichier remplace prompt_0_sql_1783630957105.sql (déplacé dans
-- Passerelle_code/onboardcc/backups/, voir la note ajoutée en tête de ce
-- fichier archivé) : ce dernier était un premier jet, jamais mis à jour
-- après le déploiement o2switch du 08/09/2026 — schéma en partie obsolète
-- (colonnes des 12 migrations absentes, competences.crm_key resté en
-- VARCHAR(20) au lieu de VARCHAR(40)) et données de démonstration bugguées
-- (adresse sans id_pays résolu). Découvert le 18/09/2026 en tentant de
-- recharger une base locale avec ce fichier — voir l'échange avec Claude de
-- ce jour pour le détail du diagnostic.
--
-- MODE D'EMPLOI (base locale ou toute réinstallation complète depuis zéro) :
--   1. Créer une base vide (psql -U postgres -c "CREATE DATABASE nom_base;")
--   2. Charger ce fichier :
--      psql -U postgres -d nom_base -f prompt_0_sql_versionAvantProd_20260918.sql
--   3. Créer le premier compte admin manuellement (aucune donnée de compte
--      n'est incluse ici) — voir §8.1 de
--      Livrables/4 - Deploiement et Soutenance/1 - Guide utilisateur/
--      1-procedure_deploiement_passerelle.md.
--
-- Si le schéma évolue encore (nouvelle migration après le 18/09/2026), ce
-- fichier devra être régénéré de la même façon : un pg_dump --schema-only à
-- jour + seed_referentiels.sql à jour — pas en éditant ce fichier à la main.
-- ============================================================================


-- ============================================================================
-- PARTIE 1 — SCHÉMA (source : backups/schema_only_20260908_101006.sql)
-- ============================================================================

--
-- PostgreSQL database dump
--


-- Dumped from database version 16.10
-- Dumped by pg_dump version 16.10

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: a_etudie_dans; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.a_etudie_dans (
    id_fiche_de_voeux integer NOT NULL,
    id_domaine integer NOT NULL
);


ALTER TABLE public.a_etudie_dans OWNER TO postgres;

--
-- Name: a_la_competence_de; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.a_la_competence_de (
    id_fiche_de_voeux integer NOT NULL,
    id_competences integer NOT NULL,
    niveau character varying(20),
    autre_competence character varying(50)
);


ALTER TABLE public.a_la_competence_de OWNER TO postgres;

--
-- Name: a_travaille_dans; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.a_travaille_dans (
    id_fiche_de_voeux integer NOT NULL,
    id_domaine integer NOT NULL
);


ALTER TABLE public.a_travaille_dans OWNER TO postgres;

--
-- Name: adresse; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.adresse (
    id_adresse integer NOT NULL,
    adresse1 character varying(50),
    adresse2 character varying(50),
    code_postal character varying(50),
    ville character varying(50),
    pays character varying(50)
);


ALTER TABLE public.adresse OWNER TO postgres;

--
-- Name: adresse_id_adresse_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.adresse_id_adresse_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.adresse_id_adresse_seq OWNER TO postgres;

--
-- Name: adresse_id_adresse_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.adresse_id_adresse_seq OWNED BY public.adresse.id_adresse;


--
-- Name: aide_contextuelle; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.aide_contextuelle (
    id_aide_contextuelle integer NOT NULL,
    cle_champ character varying(100) NOT NULL,
    texte character varying(500) NOT NULL,
    active boolean DEFAULT true NOT NULL
);


ALTER TABLE public.aide_contextuelle OWNER TO postgres;

--
-- Name: aide_contextuelle_id_aide_contextuelle_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.aide_contextuelle_id_aide_contextuelle_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.aide_contextuelle_id_aide_contextuelle_seq OWNER TO postgres;

--
-- Name: aide_contextuelle_id_aide_contextuelle_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.aide_contextuelle_id_aide_contextuelle_seq OWNED BY public.aide_contextuelle.id_aide_contextuelle;


--
-- Name: candidat; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.candidat (
    id_candidat integer NOT NULL,
    web_key character varying(50),
    crm_key character varying(40),
    trigram_candidat character varying(5),
    engagements text,
    annonces_recherchees character varying(250),
    perso_depart_en_couple boolean,
    perso_nom_prenom_conjoint character varying(50),
    perso_etat_de_vie character varying(20),
    perso_date_mariage date,
    perso_est_parent boolean,
    perso_pars_avec_enfants boolean,
    projet_date_depart_souhaitee date,
    projet_numero_offre_mission character varying(250),
    projet_motivations character varying(250),
    projet_questionnements character varying(250),
    projet_avancement character varying(250),
    projet_experience_interculturelle character varying(250),
    projet_formation_dialogue_interculturel character varying(250),
    projet_experience_de_volontariat character varying(250),
    projet_raison_du_depart_avec_la_dcc character varying(250),
    projet_attente_de_la_dcc character varying(250),
    projet_lien_avec_une_autre_structure boolean,
    projet_lien_avec_une_autre_structure_detail character varying(250),
    profil_statut character varying(20),
    profil_statut_administration_de_tutelle character varying(50),
    profil_experience_engagement boolean,
    profil_experience_engagement_detail character varying(1000),
    candidature_information_du_candidat character varying(250),
    candidature_disponibilite_du_candidat character varying(250),
    candidature_preference_session_choisir character varying(250),
    id_etat_candidat character varying(20) NOT NULL,
    id_contact integer NOT NULL,
    date_revue date,
    date_revue_modifiee_par character varying(50),
    date_revue_modifiee_le date,
    projet_duree_mission_souhaitee character varying(50),
    perso_enfants_consolides character varying(500)
);


ALTER TABLE public.candidat OWNER TO postgres;

--
-- Name: candidat_id_candidat_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.candidat_id_candidat_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.candidat_id_candidat_seq OWNER TO postgres;

--
-- Name: candidat_id_candidat_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.candidat_id_candidat_seq OWNED BY public.candidat.id_candidat;


--
-- Name: competences; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.competences (
    id_competences integer NOT NULL,
    crm_key character varying(40) NOT NULL,
    designation character varying(50) NOT NULL,
    active boolean DEFAULT true,
    id_domaine integer NOT NULL
);


ALTER TABLE public.competences OWNER TO postgres;

--
-- Name: competences_id_competences_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.competences_id_competences_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.competences_id_competences_seq OWNER TO postgres;

--
-- Name: competences_id_competences_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.competences_id_competences_seq OWNED BY public.competences.id_competences;


--
-- Name: connait_la_dcc_par; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.connait_la_dcc_par (
    id_candidat integer NOT NULL,
    id_notoriete_dcc integer NOT NULL,
    autre_designation character varying(50),
    detail character varying(50)
);


ALTER TABLE public.connait_la_dcc_par OWNER TO postgres;

--
-- Name: contact; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.contact (
    id_contact integer NOT NULL,
    crm_key character varying(50) NOT NULL,
    role character varying(20) NOT NULL,
    genre character varying(20),
    nom_contact character varying(50),
    nom_naissance character varying(50),
    prenom_contact character varying(50),
    tel_contact character varying(50),
    email_contact character varying(50),
    date_naissance date,
    lieu_naissance character varying(50),
    nationalite character varying(50),
    id_adresse integer
);


ALTER TABLE public.contact OWNER TO postgres;

--
-- Name: contact_id_contact_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.contact_id_contact_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.contact_id_contact_seq OWNER TO postgres;

--
-- Name: contact_id_contact_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.contact_id_contact_seq OWNED BY public.contact.id_contact;


--
-- Name: criteres_detailles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.criteres_detailles (
    id_criteres_detailles integer NOT NULL,
    date_evaluation date DEFAULT CURRENT_DATE,
    critere character varying(50),
    valeur_poste text,
    valeur_candidat text,
    note_obtenue numeric(8,2),
    id_opportunite integer NOT NULL
);


ALTER TABLE public.criteres_detailles OWNER TO postgres;

--
-- Name: criteres_detailles_id_criteres_detailles_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.criteres_detailles_id_criteres_detailles_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.criteres_detailles_id_criteres_detailles_seq OWNER TO postgres;

--
-- Name: criteres_detailles_id_criteres_detailles_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.criteres_detailles_id_criteres_detailles_seq OWNED BY public.criteres_detailles.id_criteres_detailles;


--
-- Name: domaine; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.domaine (
    id_domaine integer NOT NULL,
    crm_key character varying(40) NOT NULL,
    designation character varying(50),
    active boolean DEFAULT true
);


ALTER TABLE public.domaine OWNER TO postgres;

--
-- Name: domaine_id_domaine_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.domaine_id_domaine_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.domaine_id_domaine_seq OWNER TO postgres;

--
-- Name: domaine_id_domaine_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.domaine_id_domaine_seq OWNED BY public.domaine.id_domaine;


--
-- Name: duree; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.duree (
    id_duree integer NOT NULL,
    crm_key character varying(40) NOT NULL,
    periode character varying(50) NOT NULL,
    statut character varying(50) NOT NULL,
    niveau numeric(2,1),
    active boolean DEFAULT true
);


ALTER TABLE public.duree OWNER TO postgres;

--
-- Name: duree_id_duree_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.duree_id_duree_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.duree_id_duree_seq OWNER TO postgres;

--
-- Name: duree_id_duree_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.duree_id_duree_seq OWNED BY public.duree.id_duree;


--
-- Name: environnement; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.environnement (
    id_environnement integer NOT NULL,
    crm_key character varying(40) NOT NULL,
    designation character varying(50) NOT NULL,
    niveau integer,
    active boolean DEFAULT true
);


ALTER TABLE public.environnement OWNER TO postgres;

--
-- Name: environnement_id_environnement_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.environnement_id_environnement_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.environnement_id_environnement_seq OWNER TO postgres;

--
-- Name: environnement_id_environnement_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.environnement_id_environnement_seq OWNED BY public.environnement.id_environnement;


--
-- Name: est_conjoint_de; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.est_conjoint_de (
    id_contact integer NOT NULL,
    date_mariage_civil date,
    id_contact_1 integer NOT NULL
);


ALTER TABLE public.est_conjoint_de OWNER TO postgres;

--
-- Name: est_parent_de; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.est_parent_de (
    id_contact integer NOT NULL,
    id_contact_1 integer NOT NULL,
    pars_en_volontariat character varying(50)
);


ALTER TABLE public.est_parent_de OWNER TO postgres;

--
-- Name: etape; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.etape (
    id_historique integer NOT NULL,
    acteur character varying(50),
    date_evenement date DEFAULT CURRENT_DATE,
    score integer,
    note_ecrite text,
    pj_description character varying(50),
    url1_piece_jointe character varying(250),
    url2_piece_jointe character varying(250),
    id_etat_candidat character varying(20) NOT NULL,
    id_candidat integer NOT NULL
);


ALTER TABLE public.etape OWNER TO postgres;

--
-- Name: etape_id_historique_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.etape_id_historique_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.etape_id_historique_seq OWNER TO postgres;

--
-- Name: etape_id_historique_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.etape_id_historique_seq OWNED BY public.etape.id_historique;


--
-- Name: etat_candidat; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.etat_candidat (
    id_etat_candidat character varying(20) NOT NULL,
    designation character varying(50) NOT NULL,
    active boolean DEFAULT true,
    delais_de_reponse integer
);


ALTER TABLE public.etat_candidat OWNER TO postgres;

--
-- Name: etat_opportunite; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.etat_opportunite (
    id_etat_opportunite integer NOT NULL,
    designation character varying(50) NOT NULL,
    active boolean DEFAULT true
);


ALTER TABLE public.etat_opportunite OWNER TO postgres;

--
-- Name: etat_opportunite_id_etat_opportunite_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.etat_opportunite_id_etat_opportunite_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.etat_opportunite_id_etat_opportunite_seq OWNER TO postgres;

--
-- Name: etat_opportunite_id_etat_opportunite_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.etat_opportunite_id_etat_opportunite_seq OWNED BY public.etat_opportunite.id_etat_opportunite;


--
-- Name: etat_poste; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.etat_poste (
    id_etat_poste integer NOT NULL,
    designation character varying(50) NOT NULL,
    active boolean DEFAULT true
);


ALTER TABLE public.etat_poste OWNER TO postgres;

--
-- Name: etat_poste_id_etat_poste_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.etat_poste_id_etat_poste_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.etat_poste_id_etat_poste_seq OWNER TO postgres;

--
-- Name: etat_poste_id_etat_poste_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.etat_poste_id_etat_poste_seq OWNED BY public.etat_poste.id_etat_poste;


--
-- Name: evolue_dans; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.evolue_dans (
    id_environnement integer NOT NULL,
    id_poste integer NOT NULL
);


ALTER TABLE public.evolue_dans OWNER TO postgres;

--
-- Name: fiche_de_poste; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.fiche_de_poste (
    id_poste integer NOT NULL,
    crm_key character varying(40) NOT NULL,
    flag_create_opportunity boolean DEFAULT false,
    flag_poste_deja_mis_en_lien boolean DEFAULT false,
    statut_volontaire character varying(20),
    ong character varying(50),
    candidat_preaffecte boolean DEFAULT false NOT NULL,
    nom_candidat character varying(50),
    fonction character varying(100),
    date_demande date,
    priorite character varying(20),
    indemnite_mensuelle_partenaire integer,
    indemnite_mensuelle_dcc integer,
    gite_et_couvert character varying(50),
    hebergement_detail text,
    date_arrivee_souhaitee date,
    preference_genre character varying(50),
    deuxieme_poste_possible_partenaire boolean,
    deuxieme_poste_possible_alentour boolean,
    nouveau_poste boolean,
    nom_ancien_volontaire character varying(50),
    odd_lie character varying(50),
    contexte_mission text,
    objectifs_mission text,
    taches text,
    competences_detail text,
    dimension_ecclesial text,
    flag_zone_orange boolean,
    flag_condition_spartiates boolean,
    flag_hopital_proche boolean,
    id_etat_poste integer NOT NULL,
    id_pays integer NOT NULL,
    id_hebergement integer NOT NULL,
    id_duree integer NOT NULL,
    id_domaine integer NOT NULL,
    id_type_billet_avion integer,
    date_maj_crm date,
    date_dernier_recalcul_score date
);


ALTER TABLE public.fiche_de_poste OWNER TO postgres;

--
-- Name: COLUMN fiche_de_poste.date_maj_crm; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.fiche_de_poste.date_maj_crm IS 'Date de dernière modification côté CRM (import, colonne 42).';


--
-- Name: COLUMN fiche_de_poste.date_dernier_recalcul_score; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.fiche_de_poste.date_dernier_recalcul_score IS 'Valeur de date_maj_crm au moment du dernier recalcul des opportunités de ce poste — comparée (IS DISTINCT FROM) à date_maj_crm pour détecter si un recalcul est nécessaire.';


--
-- Name: fiche_de_poste_id_poste_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.fiche_de_poste_id_poste_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.fiche_de_poste_id_poste_seq OWNER TO postgres;

--
-- Name: fiche_de_poste_id_poste_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.fiche_de_poste_id_poste_seq OWNED BY public.fiche_de_poste.id_poste;


--
-- Name: fiche_de_voeux; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.fiche_de_voeux (
    id_fiche_de_voeux integer NOT NULL,
    flag_create_opportunity boolean DEFAULT false,
    flag_fiche_de_voeux_soumise boolean DEFAULT false,
    flag_update_score boolean DEFAULT false,
    flag_candidat_deja_mis_en_lien boolean DEFAULT false,
    date_creation date DEFAULT CURRENT_DATE,
    date_modification date,
    modifie_par character varying(50),
    part_seul boolean,
    zone_orange boolean,
    conditions_spartiates boolean,
    hopital_proche boolean,
    fonctionnaire_dispo_demandee character varying(50),
    date_depart_souhaite date,
    nouveau_poste boolean,
    nouvelle_langue boolean,
    competences_a_developper text,
    centres_interret text,
    categorie_ecclesiale character varying(20),
    categorie_ecclesiale_detail character varying(250),
    acces_candidat boolean DEFAULT true,
    date_voeux_provisoires date,
    date_voeux_definitifs date,
    id_candidat integer NOT NULL,
    date_depart_possible date,
    verrouille boolean DEFAULT false,
    verrouille_par character varying(50),
    date_verrouillage date,
    CONSTRAINT fiche_de_voeux_fonctionnaire_dispo_demandee_check CHECK (((fonctionnaire_dispo_demandee IS NULL) OR ((fonctionnaire_dispo_demandee)::text = ANY ((ARRAY['OUI'::character varying, 'NON'::character varying, 'NON APPLICABLE'::character varying])::text[]))))
);


ALTER TABLE public.fiche_de_voeux OWNER TO postgres;

--
-- Name: fiche_de_voeux_id_fiche_de_voeux_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.fiche_de_voeux_id_fiche_de_voeux_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.fiche_de_voeux_id_fiche_de_voeux_seq OWNER TO postgres;

--
-- Name: fiche_de_voeux_id_fiche_de_voeux_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.fiche_de_voeux_id_fiche_de_voeux_seq OWNED BY public.fiche_de_voeux.id_fiche_de_voeux;


--
-- Name: gere_poste; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.gere_poste (
    id_contact integer NOT NULL,
    id_poste integer NOT NULL
);


ALTER TABLE public.gere_poste OWNER TO postgres;

--
-- Name: hebergement; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.hebergement (
    id_hebergement integer NOT NULL,
    crm_key character varying(40) NOT NULL,
    designation character varying(50) NOT NULL,
    active boolean DEFAULT true
);


ALTER TABLE public.hebergement OWNER TO postgres;

--
-- Name: hebergement_id_hebergement_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.hebergement_id_hebergement_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.hebergement_id_hebergement_seq OWNER TO postgres;

--
-- Name: hebergement_id_hebergement_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.hebergement_id_hebergement_seq OWNED BY public.hebergement.id_hebergement;


--
-- Name: historique_poste; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.historique_poste (
    id_historique integer NOT NULL,
    id_poste integer NOT NULL,
    id_contact integer,
    action character varying(20) NOT NULL,
    commentaire text NOT NULL,
    pieces_jointes jsonb DEFAULT '[]'::jsonb NOT NULL,
    date_evenement timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.historique_poste OWNER TO postgres;

--
-- Name: historique_poste_id_historique_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.historique_poste_id_historique_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.historique_poste_id_historique_seq OWNER TO postgres;

--
-- Name: historique_poste_id_historique_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.historique_poste_id_historique_seq OWNED BY public.historique_poste.id_historique;


--
-- Name: inscrit_a; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.inscrit_a (
    id_fiche_de_voeux integer NOT NULL,
    id_stages integer NOT NULL
);


ALTER TABLE public.inscrit_a OWNER TO postgres;

--
-- Name: langue; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.langue (
    id_langue integer NOT NULL,
    crm_key character varying(40) NOT NULL,
    designation character varying(50) NOT NULL,
    active boolean DEFAULT true
);


ALTER TABLE public.langue OWNER TO postgres;

--
-- Name: langue_id_langue_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.langue_id_langue_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.langue_id_langue_seq OWNER TO postgres;

--
-- Name: langue_id_langue_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.langue_id_langue_seq OWNED BY public.langue.id_langue;


--
-- Name: langue_poste; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.langue_poste (
    id_poste integer NOT NULL,
    id_langue integer NOT NULL,
    id_niveau_langue integer
);


ALTER TABLE public.langue_poste OWNER TO postgres;

--
-- Name: niveau_langue; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.niveau_langue (
    id_niveau_langue integer NOT NULL,
    designation character varying(20) NOT NULL,
    ordre integer NOT NULL,
    crm_key character varying(40) NOT NULL,
    active boolean DEFAULT true NOT NULL
);


ALTER TABLE public.niveau_langue OWNER TO postgres;

--
-- Name: niveau_langue_id_niveau_langue_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.niveau_langue_id_niveau_langue_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.niveau_langue_id_niveau_langue_seq OWNER TO postgres;

--
-- Name: niveau_langue_id_niveau_langue_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.niveau_langue_id_niveau_langue_seq OWNED BY public.niveau_langue.id_niveau_langue;


--
-- Name: notoriete_dcc; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notoriete_dcc (
    id_notoriete_dcc integer NOT NULL,
    designation character varying(50) NOT NULL,
    active boolean DEFAULT true NOT NULL,
    crm_key character varying(40) NOT NULL
);


ALTER TABLE public.notoriete_dcc OWNER TO postgres;

--
-- Name: notoriete_dcc_id_notoriete_dcc_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.notoriete_dcc_id_notoriete_dcc_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.notoriete_dcc_id_notoriete_dcc_seq OWNER TO postgres;

--
-- Name: notoriete_dcc_id_notoriete_dcc_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.notoriete_dcc_id_notoriete_dcc_seq OWNED BY public.notoriete_dcc.id_notoriete_dcc;


--
-- Name: opportunite; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.opportunite (
    id_opportunite integer NOT NULL,
    flag_opportunite_proposee_a_cm boolean DEFAULT false,
    flag_opportunite_retenue boolean DEFAULT false,
    flag_opportunite_non_retenu boolean DEFAULT false,
    note_contexte numeric(8,2),
    note_mission numeric(8,2),
    note_warning numeric(8,2),
    id_etat_opportunite integer NOT NULL,
    id_poste integer NOT NULL,
    id_fiche_de_voeux integer NOT NULL,
    flag_opportunite_obsolete boolean DEFAULT false NOT NULL,
    historique jsonb DEFAULT '[]'::jsonb NOT NULL
);


ALTER TABLE public.opportunite OWNER TO postgres;

--
-- Name: opportunite_id_opportunite_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.opportunite_id_opportunite_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.opportunite_id_opportunite_seq OWNER TO postgres;

--
-- Name: opportunite_id_opportunite_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.opportunite_id_opportunite_seq OWNED BY public.opportunite.id_opportunite;


--
-- Name: parle; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.parle (
    id_fiche_de_voeux integer NOT NULL,
    id_langue integer NOT NULL,
    autre_langue character varying(50),
    id_niveau_langue integer
);


ALTER TABLE public.parle OWNER TO postgres;

--
-- Name: pays; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pays (
    id_pays integer NOT NULL,
    crm_key character varying(40) NOT NULL,
    designation character varying(50) NOT NULL,
    active boolean DEFAULT true,
    id_region integer NOT NULL
);


ALTER TABLE public.pays OWNER TO postgres;

--
-- Name: pays_id_pays_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.pays_id_pays_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.pays_id_pays_seq OWNER TO postgres;

--
-- Name: pays_id_pays_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.pays_id_pays_seq OWNED BY public.pays.id_pays;


--
-- Name: recherche; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.recherche (
    id_competences integer NOT NULL,
    id_poste integer NOT NULL
);


ALTER TABLE public.recherche OWNER TO postgres;

--
-- Name: region; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.region (
    id_region integer NOT NULL,
    crm_key character varying(40) NOT NULL,
    designation character varying(50) NOT NULL,
    active boolean DEFAULT true
);


ALTER TABLE public.region OWNER TO postgres;

--
-- Name: region_id_region_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.region_id_region_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.region_id_region_seq OWNER TO postgres;

--
-- Name: region_id_region_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.region_id_region_seq OWNED BY public.region.id_region;


--
-- Name: stages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.stages (
    id_stages integer NOT NULL,
    type_stage character varying(20),
    date_debut date,
    date_fin date,
    active boolean DEFAULT true,
    voeux_definitif_ouvert boolean DEFAULT false
);


ALTER TABLE public.stages OWNER TO postgres;

--
-- Name: stages_id_stages_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.stages_id_stages_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.stages_id_stages_seq OWNER TO postgres;

--
-- Name: stages_id_stages_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.stages_id_stages_seq OWNED BY public.stages.id_stages;


--
-- Name: type_billet_avion; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.type_billet_avion (
    id_type_billet_avion integer NOT NULL,
    crm_key character varying(40) NOT NULL,
    designation character varying(50) NOT NULL,
    active boolean DEFAULT true
);


ALTER TABLE public.type_billet_avion OWNER TO postgres;

--
-- Name: type_billet_avion_id_type_billet_avion_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.type_billet_avion_id_type_billet_avion_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.type_billet_avion_id_type_billet_avion_seq OWNER TO postgres;

--
-- Name: type_billet_avion_id_type_billet_avion_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.type_billet_avion_id_type_billet_avion_seq OWNED BY public.type_billet_avion.id_type_billet_avion;


--
-- Name: user_; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_ (
    id_user integer NOT NULL,
    login character varying(50) NOT NULL,
    password character varying(1000) NOT NULL,
    id_contact integer NOT NULL,
    active boolean DEFAULT true NOT NULL,
    password_reset_requested_at timestamp with time zone,
    password_reset_nonce_hash character varying(64),
    role_applicatif character varying(20) NOT NULL,
    CONSTRAINT chk_role_applicatif CHECK (((role_applicatif)::text = ANY ((ARRAY['ADMIN'::character varying, 'RECRUTEUR'::character varying, 'CM'::character varying, 'CANDIDAT'::character varying])::text[])))
);


ALTER TABLE public.user_ OWNER TO postgres;

--
-- Name: user__id_user_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.user__id_user_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user__id_user_seq OWNER TO postgres;

--
-- Name: user__id_user_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.user__id_user_seq OWNED BY public.user_.id_user;


--
-- Name: veut_aller_a; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.veut_aller_a (
    id_fiche_de_voeux integer NOT NULL,
    id_region integer NOT NULL,
    degre character varying(20)
);


ALTER TABLE public.veut_aller_a OWNER TO postgres;

--
-- Name: veut_habiter_dans; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.veut_habiter_dans (
    id_fiche_de_voeux integer NOT NULL,
    id_hebergement integer NOT NULL
);


ALTER TABLE public.veut_habiter_dans OWNER TO postgres;

--
-- Name: veut_partir_pour; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.veut_partir_pour (
    id_fiche_de_voeux integer NOT NULL,
    id_duree integer NOT NULL,
    projet_duree_specifique character varying(50)
);


ALTER TABLE public.veut_partir_pour OWNER TO postgres;

--
-- Name: veut_vivre_dans; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.veut_vivre_dans (
    id_fiche_de_voeux integer NOT NULL,
    id_environnement integer NOT NULL
);


ALTER TABLE public.veut_vivre_dans OWNER TO postgres;

--
-- Name: adresse id_adresse; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.adresse ALTER COLUMN id_adresse SET DEFAULT nextval('public.adresse_id_adresse_seq'::regclass);


--
-- Name: aide_contextuelle id_aide_contextuelle; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.aide_contextuelle ALTER COLUMN id_aide_contextuelle SET DEFAULT nextval('public.aide_contextuelle_id_aide_contextuelle_seq'::regclass);


--
-- Name: candidat id_candidat; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.candidat ALTER COLUMN id_candidat SET DEFAULT nextval('public.candidat_id_candidat_seq'::regclass);


--
-- Name: competences id_competences; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.competences ALTER COLUMN id_competences SET DEFAULT nextval('public.competences_id_competences_seq'::regclass);


--
-- Name: contact id_contact; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contact ALTER COLUMN id_contact SET DEFAULT nextval('public.contact_id_contact_seq'::regclass);


--
-- Name: criteres_detailles id_criteres_detailles; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.criteres_detailles ALTER COLUMN id_criteres_detailles SET DEFAULT nextval('public.criteres_detailles_id_criteres_detailles_seq'::regclass);


--
-- Name: domaine id_domaine; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.domaine ALTER COLUMN id_domaine SET DEFAULT nextval('public.domaine_id_domaine_seq'::regclass);


--
-- Name: duree id_duree; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.duree ALTER COLUMN id_duree SET DEFAULT nextval('public.duree_id_duree_seq'::regclass);


--
-- Name: environnement id_environnement; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.environnement ALTER COLUMN id_environnement SET DEFAULT nextval('public.environnement_id_environnement_seq'::regclass);


--
-- Name: etape id_historique; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.etape ALTER COLUMN id_historique SET DEFAULT nextval('public.etape_id_historique_seq'::regclass);


--
-- Name: etat_opportunite id_etat_opportunite; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.etat_opportunite ALTER COLUMN id_etat_opportunite SET DEFAULT nextval('public.etat_opportunite_id_etat_opportunite_seq'::regclass);


--
-- Name: etat_poste id_etat_poste; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.etat_poste ALTER COLUMN id_etat_poste SET DEFAULT nextval('public.etat_poste_id_etat_poste_seq'::regclass);


--
-- Name: fiche_de_poste id_poste; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fiche_de_poste ALTER COLUMN id_poste SET DEFAULT nextval('public.fiche_de_poste_id_poste_seq'::regclass);


--
-- Name: fiche_de_voeux id_fiche_de_voeux; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fiche_de_voeux ALTER COLUMN id_fiche_de_voeux SET DEFAULT nextval('public.fiche_de_voeux_id_fiche_de_voeux_seq'::regclass);


--
-- Name: hebergement id_hebergement; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hebergement ALTER COLUMN id_hebergement SET DEFAULT nextval('public.hebergement_id_hebergement_seq'::regclass);


--
-- Name: historique_poste id_historique; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.historique_poste ALTER COLUMN id_historique SET DEFAULT nextval('public.historique_poste_id_historique_seq'::regclass);


--
-- Name: langue id_langue; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.langue ALTER COLUMN id_langue SET DEFAULT nextval('public.langue_id_langue_seq'::regclass);


--
-- Name: niveau_langue id_niveau_langue; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.niveau_langue ALTER COLUMN id_niveau_langue SET DEFAULT nextval('public.niveau_langue_id_niveau_langue_seq'::regclass);


--
-- Name: notoriete_dcc id_notoriete_dcc; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notoriete_dcc ALTER COLUMN id_notoriete_dcc SET DEFAULT nextval('public.notoriete_dcc_id_notoriete_dcc_seq'::regclass);


--
-- Name: opportunite id_opportunite; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.opportunite ALTER COLUMN id_opportunite SET DEFAULT nextval('public.opportunite_id_opportunite_seq'::regclass);


--
-- Name: pays id_pays; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pays ALTER COLUMN id_pays SET DEFAULT nextval('public.pays_id_pays_seq'::regclass);


--
-- Name: region id_region; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.region ALTER COLUMN id_region SET DEFAULT nextval('public.region_id_region_seq'::regclass);


--
-- Name: stages id_stages; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stages ALTER COLUMN id_stages SET DEFAULT nextval('public.stages_id_stages_seq'::regclass);


--
-- Name: type_billet_avion id_type_billet_avion; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.type_billet_avion ALTER COLUMN id_type_billet_avion SET DEFAULT nextval('public.type_billet_avion_id_type_billet_avion_seq'::regclass);


--
-- Name: user_ id_user; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_ ALTER COLUMN id_user SET DEFAULT nextval('public.user__id_user_seq'::regclass);


--
-- Name: a_etudie_dans a_etudie_dans_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.a_etudie_dans
    ADD CONSTRAINT a_etudie_dans_pkey PRIMARY KEY (id_fiche_de_voeux, id_domaine);


--
-- Name: a_la_competence_de a_la_competence_de_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.a_la_competence_de
    ADD CONSTRAINT a_la_competence_de_pkey PRIMARY KEY (id_fiche_de_voeux, id_competences);


--
-- Name: a_travaille_dans a_travaille_dans_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.a_travaille_dans
    ADD CONSTRAINT a_travaille_dans_pkey PRIMARY KEY (id_fiche_de_voeux, id_domaine);


--
-- Name: adresse adresse_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.adresse
    ADD CONSTRAINT adresse_pkey PRIMARY KEY (id_adresse);


--
-- Name: aide_contextuelle aide_contextuelle_cle_champ_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.aide_contextuelle
    ADD CONSTRAINT aide_contextuelle_cle_champ_key UNIQUE (cle_champ);


--
-- Name: aide_contextuelle aide_contextuelle_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.aide_contextuelle
    ADD CONSTRAINT aide_contextuelle_pkey PRIMARY KEY (id_aide_contextuelle);


--
-- Name: candidat candidat_crm_key_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.candidat
    ADD CONSTRAINT candidat_crm_key_key UNIQUE (crm_key);


--
-- Name: candidat candidat_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.candidat
    ADD CONSTRAINT candidat_pkey PRIMARY KEY (id_candidat);


--
-- Name: candidat candidat_web_key_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.candidat
    ADD CONSTRAINT candidat_web_key_key UNIQUE (web_key);


--
-- Name: competences competences_crm_key_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.competences
    ADD CONSTRAINT competences_crm_key_key UNIQUE (crm_key);


--
-- Name: competences competences_designation_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.competences
    ADD CONSTRAINT competences_designation_key UNIQUE (designation);


--
-- Name: competences competences_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.competences
    ADD CONSTRAINT competences_pkey PRIMARY KEY (id_competences);


--
-- Name: connait_la_dcc_par connait_la_dcc_par_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.connait_la_dcc_par
    ADD CONSTRAINT connait_la_dcc_par_pkey PRIMARY KEY (id_candidat, id_notoriete_dcc);


--
-- Name: contact contact_crm_key_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contact
    ADD CONSTRAINT contact_crm_key_key UNIQUE (crm_key);


--
-- Name: contact contact_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contact
    ADD CONSTRAINT contact_pkey PRIMARY KEY (id_contact);


--
-- Name: criteres_detailles criteres_detailles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.criteres_detailles
    ADD CONSTRAINT criteres_detailles_pkey PRIMARY KEY (id_criteres_detailles);

ALTER TABLE ONLY public.criteres_detailles
    ADD CONSTRAINT criteres_detailles_opportunite_critere_key UNIQUE (id_opportunite, critere);


--
-- Name: domaine domaine_crm_key_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.domaine
    ADD CONSTRAINT domaine_crm_key_key UNIQUE (crm_key);


--
-- Name: domaine domaine_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.domaine
    ADD CONSTRAINT domaine_pkey PRIMARY KEY (id_domaine);


--
-- Name: duree duree_crm_key_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.duree
    ADD CONSTRAINT duree_crm_key_key UNIQUE (crm_key);


--
-- Name: duree duree_periode_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.duree
    ADD CONSTRAINT duree_periode_key UNIQUE (periode);


--
-- Name: duree duree_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.duree
    ADD CONSTRAINT duree_pkey PRIMARY KEY (id_duree);


--
-- Name: environnement environnement_crm_key_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.environnement
    ADD CONSTRAINT environnement_crm_key_key UNIQUE (crm_key);


--
-- Name: environnement environnement_designation_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.environnement
    ADD CONSTRAINT environnement_designation_key UNIQUE (designation);


--
-- Name: environnement environnement_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.environnement
    ADD CONSTRAINT environnement_pkey PRIMARY KEY (id_environnement);


--
-- Name: est_conjoint_de est_conjoint_de_id_contact_1_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.est_conjoint_de
    ADD CONSTRAINT est_conjoint_de_id_contact_1_key UNIQUE (id_contact_1);


--
-- Name: est_conjoint_de est_conjoint_de_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.est_conjoint_de
    ADD CONSTRAINT est_conjoint_de_pkey PRIMARY KEY (id_contact);


--
-- Name: est_parent_de est_parent_de_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.est_parent_de
    ADD CONSTRAINT est_parent_de_pkey PRIMARY KEY (id_contact, id_contact_1);


--
-- Name: etape etape_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.etape
    ADD CONSTRAINT etape_pkey PRIMARY KEY (id_historique);


--
-- Name: etat_candidat etat_candidat_designation_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.etat_candidat
    ADD CONSTRAINT etat_candidat_designation_key UNIQUE (designation);


--
-- Name: etat_candidat etat_candidat_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.etat_candidat
    ADD CONSTRAINT etat_candidat_pkey PRIMARY KEY (id_etat_candidat);


--
-- Name: etat_opportunite etat_opportunite_designation_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.etat_opportunite
    ADD CONSTRAINT etat_opportunite_designation_key UNIQUE (designation);


--
-- Name: etat_opportunite etat_opportunite_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.etat_opportunite
    ADD CONSTRAINT etat_opportunite_pkey PRIMARY KEY (id_etat_opportunite);


--
-- Name: etat_poste etat_poste_designation_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.etat_poste
    ADD CONSTRAINT etat_poste_designation_key UNIQUE (designation);


--
-- Name: etat_poste etat_poste_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.etat_poste
    ADD CONSTRAINT etat_poste_pkey PRIMARY KEY (id_etat_poste);


--
-- Name: evolue_dans evolue_dans_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.evolue_dans
    ADD CONSTRAINT evolue_dans_pkey PRIMARY KEY (id_environnement, id_poste);


--
-- Name: fiche_de_poste fiche_de_poste_crm_key_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fiche_de_poste
    ADD CONSTRAINT fiche_de_poste_crm_key_key UNIQUE (crm_key);


--
-- Name: fiche_de_poste fiche_de_poste_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fiche_de_poste
    ADD CONSTRAINT fiche_de_poste_pkey PRIMARY KEY (id_poste);


--
-- Name: fiche_de_voeux fiche_de_voeux_id_candidat_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fiche_de_voeux
    ADD CONSTRAINT fiche_de_voeux_id_candidat_key UNIQUE (id_candidat);


--
-- Name: fiche_de_voeux fiche_de_voeux_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fiche_de_voeux
    ADD CONSTRAINT fiche_de_voeux_pkey PRIMARY KEY (id_fiche_de_voeux);


--
-- Name: gere_poste gere_poste_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gere_poste
    ADD CONSTRAINT gere_poste_pkey PRIMARY KEY (id_contact, id_poste);


--
-- Name: hebergement hebergement_crm_key_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hebergement
    ADD CONSTRAINT hebergement_crm_key_key UNIQUE (crm_key);


--
-- Name: hebergement hebergement_designation_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hebergement
    ADD CONSTRAINT hebergement_designation_key UNIQUE (designation);


--
-- Name: hebergement hebergement_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hebergement
    ADD CONSTRAINT hebergement_pkey PRIMARY KEY (id_hebergement);


--
-- Name: historique_poste historique_poste_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.historique_poste
    ADD CONSTRAINT historique_poste_pkey PRIMARY KEY (id_historique);


--
-- Name: inscrit_a inscrit_a_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inscrit_a
    ADD CONSTRAINT inscrit_a_pkey PRIMARY KEY (id_fiche_de_voeux, id_stages);


--
-- Name: langue langue_crm_key_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.langue
    ADD CONSTRAINT langue_crm_key_key UNIQUE (crm_key);


--
-- Name: langue langue_designation_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.langue
    ADD CONSTRAINT langue_designation_key UNIQUE (designation);


--
-- Name: langue langue_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.langue
    ADD CONSTRAINT langue_pkey PRIMARY KEY (id_langue);


--
-- Name: langue_poste langue_poste_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.langue_poste
    ADD CONSTRAINT langue_poste_pkey PRIMARY KEY (id_poste);


--
-- Name: niveau_langue niveau_langue_crm_key_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.niveau_langue
    ADD CONSTRAINT niveau_langue_crm_key_key UNIQUE (crm_key);


--
-- Name: niveau_langue niveau_langue_designation_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.niveau_langue
    ADD CONSTRAINT niveau_langue_designation_key UNIQUE (designation);


--
-- Name: niveau_langue niveau_langue_ordre_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.niveau_langue
    ADD CONSTRAINT niveau_langue_ordre_key UNIQUE (ordre);


--
-- Name: niveau_langue niveau_langue_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.niveau_langue
    ADD CONSTRAINT niveau_langue_pkey PRIMARY KEY (id_niveau_langue);


--
-- Name: notoriete_dcc notoriete_dcc_crm_key_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notoriete_dcc
    ADD CONSTRAINT notoriete_dcc_crm_key_key UNIQUE (crm_key);


--
-- Name: notoriete_dcc notoriete_dcc_designation_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notoriete_dcc
    ADD CONSTRAINT notoriete_dcc_designation_key UNIQUE (designation);


--
-- Name: notoriete_dcc notoriete_dcc_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notoriete_dcc
    ADD CONSTRAINT notoriete_dcc_pkey PRIMARY KEY (id_notoriete_dcc);


--
-- Name: opportunite opportunite_id_fiche_de_voeux_id_poste_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.opportunite
    ADD CONSTRAINT opportunite_id_fiche_de_voeux_id_poste_key UNIQUE (id_fiche_de_voeux, id_poste);


--
-- Name: opportunite opportunite_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.opportunite
    ADD CONSTRAINT opportunite_pkey PRIMARY KEY (id_opportunite);


--
-- Name: parle parle_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.parle
    ADD CONSTRAINT parle_pkey PRIMARY KEY (id_fiche_de_voeux, id_langue);


--
-- Name: pays pays_crm_key_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pays
    ADD CONSTRAINT pays_crm_key_key UNIQUE (crm_key);


--
-- Name: pays pays_designation_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pays
    ADD CONSTRAINT pays_designation_key UNIQUE (designation);


--
-- Name: pays pays_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pays
    ADD CONSTRAINT pays_pkey PRIMARY KEY (id_pays);


--
-- Name: recherche recherche_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recherche
    ADD CONSTRAINT recherche_pkey PRIMARY KEY (id_competences, id_poste);


--
-- Name: region region_crm_key_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.region
    ADD CONSTRAINT region_crm_key_key UNIQUE (crm_key);


--
-- Name: region region_designation_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.region
    ADD CONSTRAINT region_designation_key UNIQUE (designation);


--
-- Name: region region_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.region
    ADD CONSTRAINT region_pkey PRIMARY KEY (id_region);


--
-- Name: stages stages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stages
    ADD CONSTRAINT stages_pkey PRIMARY KEY (id_stages);


--
-- Name: type_billet_avion type_billet_avion_crm_key_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.type_billet_avion
    ADD CONSTRAINT type_billet_avion_crm_key_key UNIQUE (crm_key);


--
-- Name: type_billet_avion type_billet_avion_designation_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.type_billet_avion
    ADD CONSTRAINT type_billet_avion_designation_key UNIQUE (designation);


--
-- Name: type_billet_avion type_billet_avion_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.type_billet_avion
    ADD CONSTRAINT type_billet_avion_pkey PRIMARY KEY (id_type_billet_avion);


--
-- Name: user_ user__id_contact_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_
    ADD CONSTRAINT user__id_contact_key UNIQUE (id_contact);


--
-- Name: user_ user__login_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_
    ADD CONSTRAINT user__login_key UNIQUE (login);


--
-- Name: user_ user__pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_
    ADD CONSTRAINT user__pkey PRIMARY KEY (id_user);


--
-- Name: veut_aller_a veut_aller_a_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.veut_aller_a
    ADD CONSTRAINT veut_aller_a_pkey PRIMARY KEY (id_fiche_de_voeux, id_region);


--
-- Name: veut_habiter_dans veut_habiter_dans_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.veut_habiter_dans
    ADD CONSTRAINT veut_habiter_dans_pkey PRIMARY KEY (id_fiche_de_voeux, id_hebergement);


--
-- Name: veut_partir_pour veut_partir_pour_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.veut_partir_pour
    ADD CONSTRAINT veut_partir_pour_pkey PRIMARY KEY (id_fiche_de_voeux, id_duree);


--
-- Name: veut_vivre_dans veut_vivre_dans_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.veut_vivre_dans
    ADD CONSTRAINT veut_vivre_dans_pkey PRIMARY KEY (id_fiche_de_voeux, id_environnement);


--
-- Name: idx_criteres_detailles_opportunite; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_criteres_detailles_opportunite ON public.criteres_detailles USING btree (id_opportunite, date_evaluation DESC);


--
-- Name: idx_opportunite_fiche_voeux; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_opportunite_fiche_voeux ON public.opportunite USING btree (id_fiche_de_voeux);


--
-- Name: idx_opportunite_poste; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_opportunite_poste ON public.opportunite USING btree (id_poste);


--
-- Name: a_etudie_dans a_etudie_dans_id_domaine_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.a_etudie_dans
    ADD CONSTRAINT a_etudie_dans_id_domaine_fkey FOREIGN KEY (id_domaine) REFERENCES public.domaine(id_domaine);


--
-- Name: a_etudie_dans a_etudie_dans_id_fiche_de_voeux_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.a_etudie_dans
    ADD CONSTRAINT a_etudie_dans_id_fiche_de_voeux_fkey FOREIGN KEY (id_fiche_de_voeux) REFERENCES public.fiche_de_voeux(id_fiche_de_voeux);


--
-- Name: a_la_competence_de a_la_competence_de_id_competences_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.a_la_competence_de
    ADD CONSTRAINT a_la_competence_de_id_competences_fkey FOREIGN KEY (id_competences) REFERENCES public.competences(id_competences);


--
-- Name: a_la_competence_de a_la_competence_de_id_fiche_de_voeux_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.a_la_competence_de
    ADD CONSTRAINT a_la_competence_de_id_fiche_de_voeux_fkey FOREIGN KEY (id_fiche_de_voeux) REFERENCES public.fiche_de_voeux(id_fiche_de_voeux);


--
-- Name: a_travaille_dans a_travaille_dans_id_domaine_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.a_travaille_dans
    ADD CONSTRAINT a_travaille_dans_id_domaine_fkey FOREIGN KEY (id_domaine) REFERENCES public.domaine(id_domaine);


--
-- Name: a_travaille_dans a_travaille_dans_id_fiche_de_voeux_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.a_travaille_dans
    ADD CONSTRAINT a_travaille_dans_id_fiche_de_voeux_fkey FOREIGN KEY (id_fiche_de_voeux) REFERENCES public.fiche_de_voeux(id_fiche_de_voeux);


-- (adresse.id_pays et sa clé étrangère supprimés le 24/09/2026 — migration 019 : le pays d'une
-- adresse de contact est désormais un texte libre, voir adresse.pays)

--
-- Name: candidat candidat_id_contact_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.candidat
    ADD CONSTRAINT candidat_id_contact_fkey FOREIGN KEY (id_contact) REFERENCES public.contact(id_contact);


--
-- Name: candidat candidat_id_etat_candidat_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.candidat
    ADD CONSTRAINT candidat_id_etat_candidat_fkey FOREIGN KEY (id_etat_candidat) REFERENCES public.etat_candidat(id_etat_candidat);


--
-- Name: competences competences_id_domaine_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.competences
    ADD CONSTRAINT competences_id_domaine_fkey FOREIGN KEY (id_domaine) REFERENCES public.domaine(id_domaine);


--
-- Name: connait_la_dcc_par connait_la_dcc_par_id_candidat_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.connait_la_dcc_par
    ADD CONSTRAINT connait_la_dcc_par_id_candidat_fkey FOREIGN KEY (id_candidat) REFERENCES public.candidat(id_candidat);


--
-- Name: connait_la_dcc_par connait_la_dcc_par_id_notoriete_dcc_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.connait_la_dcc_par
    ADD CONSTRAINT connait_la_dcc_par_id_notoriete_dcc_fkey FOREIGN KEY (id_notoriete_dcc) REFERENCES public.notoriete_dcc(id_notoriete_dcc);


--
-- Name: contact contact_id_adresse_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contact
    ADD CONSTRAINT contact_id_adresse_fkey FOREIGN KEY (id_adresse) REFERENCES public.adresse(id_adresse);


--
-- Name: criteres_detailles criteres_detailles_id_opportunite_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.criteres_detailles
    ADD CONSTRAINT criteres_detailles_id_opportunite_fkey FOREIGN KEY (id_opportunite) REFERENCES public.opportunite(id_opportunite);


--
-- Name: est_conjoint_de est_conjoint_de_id_contact_1_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.est_conjoint_de
    ADD CONSTRAINT est_conjoint_de_id_contact_1_fkey FOREIGN KEY (id_contact_1) REFERENCES public.contact(id_contact);


--
-- Name: est_conjoint_de est_conjoint_de_id_contact_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.est_conjoint_de
    ADD CONSTRAINT est_conjoint_de_id_contact_fkey FOREIGN KEY (id_contact) REFERENCES public.contact(id_contact);


--
-- Name: est_parent_de est_parent_de_id_contact_1_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.est_parent_de
    ADD CONSTRAINT est_parent_de_id_contact_1_fkey FOREIGN KEY (id_contact_1) REFERENCES public.contact(id_contact);


--
-- Name: est_parent_de est_parent_de_id_contact_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.est_parent_de
    ADD CONSTRAINT est_parent_de_id_contact_fkey FOREIGN KEY (id_contact) REFERENCES public.contact(id_contact);


--
-- Name: etape etape_id_candidat_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.etape
    ADD CONSTRAINT etape_id_candidat_fkey FOREIGN KEY (id_candidat) REFERENCES public.candidat(id_candidat);


--
-- Name: etape etape_id_etat_candidat_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.etape
    ADD CONSTRAINT etape_id_etat_candidat_fkey FOREIGN KEY (id_etat_candidat) REFERENCES public.etat_candidat(id_etat_candidat);


--
-- Name: evolue_dans evolue_dans_id_environnement_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.evolue_dans
    ADD CONSTRAINT evolue_dans_id_environnement_fkey FOREIGN KEY (id_environnement) REFERENCES public.environnement(id_environnement);


--
-- Name: evolue_dans evolue_dans_id_poste_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.evolue_dans
    ADD CONSTRAINT evolue_dans_id_poste_fkey FOREIGN KEY (id_poste) REFERENCES public.fiche_de_poste(id_poste);


--
-- Name: fiche_de_poste fiche_de_poste_id_domaine_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fiche_de_poste
    ADD CONSTRAINT fiche_de_poste_id_domaine_fkey FOREIGN KEY (id_domaine) REFERENCES public.domaine(id_domaine);


--
-- Name: fiche_de_poste fiche_de_poste_id_duree_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fiche_de_poste
    ADD CONSTRAINT fiche_de_poste_id_duree_fkey FOREIGN KEY (id_duree) REFERENCES public.duree(id_duree);


--
-- Name: fiche_de_poste fiche_de_poste_id_etat_poste_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fiche_de_poste
    ADD CONSTRAINT fiche_de_poste_id_etat_poste_fkey FOREIGN KEY (id_etat_poste) REFERENCES public.etat_poste(id_etat_poste);


--
-- Name: fiche_de_poste fiche_de_poste_id_hebergement_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fiche_de_poste
    ADD CONSTRAINT fiche_de_poste_id_hebergement_fkey FOREIGN KEY (id_hebergement) REFERENCES public.hebergement(id_hebergement);


--
-- Name: fiche_de_poste fiche_de_poste_id_pays_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fiche_de_poste
    ADD CONSTRAINT fiche_de_poste_id_pays_fkey FOREIGN KEY (id_pays) REFERENCES public.pays(id_pays);


--
-- Name: fiche_de_poste fiche_de_poste_id_type_billet_avion_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fiche_de_poste
    ADD CONSTRAINT fiche_de_poste_id_type_billet_avion_fkey FOREIGN KEY (id_type_billet_avion) REFERENCES public.type_billet_avion(id_type_billet_avion);


--
-- Name: fiche_de_voeux fiche_de_voeux_id_candidat_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fiche_de_voeux
    ADD CONSTRAINT fiche_de_voeux_id_candidat_fkey FOREIGN KEY (id_candidat) REFERENCES public.candidat(id_candidat);


--
-- Name: gere_poste gere_poste_id_contact_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gere_poste
    ADD CONSTRAINT gere_poste_id_contact_fkey FOREIGN KEY (id_contact) REFERENCES public.contact(id_contact);


--
-- Name: gere_poste gere_poste_id_poste_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gere_poste
    ADD CONSTRAINT gere_poste_id_poste_fkey FOREIGN KEY (id_poste) REFERENCES public.fiche_de_poste(id_poste);


--
-- Name: historique_poste historique_poste_id_contact_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.historique_poste
    ADD CONSTRAINT historique_poste_id_contact_fkey FOREIGN KEY (id_contact) REFERENCES public.contact(id_contact);


--
-- Name: historique_poste historique_poste_id_poste_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.historique_poste
    ADD CONSTRAINT historique_poste_id_poste_fkey FOREIGN KEY (id_poste) REFERENCES public.fiche_de_poste(id_poste) ON DELETE CASCADE;


--
-- Name: inscrit_a inscrit_a_id_fiche_de_voeux_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inscrit_a
    ADD CONSTRAINT inscrit_a_id_fiche_de_voeux_fkey FOREIGN KEY (id_fiche_de_voeux) REFERENCES public.fiche_de_voeux(id_fiche_de_voeux);


--
-- Name: inscrit_a inscrit_a_id_stages_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inscrit_a
    ADD CONSTRAINT inscrit_a_id_stages_fkey FOREIGN KEY (id_stages) REFERENCES public.stages(id_stages);


--
-- Name: langue_poste langue_poste_id_langue_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.langue_poste
    ADD CONSTRAINT langue_poste_id_langue_fkey FOREIGN KEY (id_langue) REFERENCES public.langue(id_langue);


--
-- Name: langue_poste langue_poste_id_niveau_langue_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.langue_poste
    ADD CONSTRAINT langue_poste_id_niveau_langue_fkey FOREIGN KEY (id_niveau_langue) REFERENCES public.niveau_langue(id_niveau_langue);


--
-- Name: langue_poste langue_poste_id_poste_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.langue_poste
    ADD CONSTRAINT langue_poste_id_poste_fkey FOREIGN KEY (id_poste) REFERENCES public.fiche_de_poste(id_poste);


--
-- Name: opportunite opportunite_id_etat_opportunite_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.opportunite
    ADD CONSTRAINT opportunite_id_etat_opportunite_fkey FOREIGN KEY (id_etat_opportunite) REFERENCES public.etat_opportunite(id_etat_opportunite);


--
-- Name: opportunite opportunite_id_fiche_de_voeux_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.opportunite
    ADD CONSTRAINT opportunite_id_fiche_de_voeux_fkey FOREIGN KEY (id_fiche_de_voeux) REFERENCES public.fiche_de_voeux(id_fiche_de_voeux);


--
-- Name: opportunite opportunite_id_poste_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.opportunite
    ADD CONSTRAINT opportunite_id_poste_fkey FOREIGN KEY (id_poste) REFERENCES public.fiche_de_poste(id_poste);


--
-- Name: parle parle_id_fiche_de_voeux_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.parle
    ADD CONSTRAINT parle_id_fiche_de_voeux_fkey FOREIGN KEY (id_fiche_de_voeux) REFERENCES public.fiche_de_voeux(id_fiche_de_voeux);


--
-- Name: parle parle_id_langue_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.parle
    ADD CONSTRAINT parle_id_langue_fkey FOREIGN KEY (id_langue) REFERENCES public.langue(id_langue);


--
-- Name: parle parle_id_niveau_langue_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.parle
    ADD CONSTRAINT parle_id_niveau_langue_fkey FOREIGN KEY (id_niveau_langue) REFERENCES public.niveau_langue(id_niveau_langue);


--
-- Name: pays pays_id_region_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pays
    ADD CONSTRAINT pays_id_region_fkey FOREIGN KEY (id_region) REFERENCES public.region(id_region);


--
-- Name: recherche recherche_id_competences_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recherche
    ADD CONSTRAINT recherche_id_competences_fkey FOREIGN KEY (id_competences) REFERENCES public.competences(id_competences);


--
-- Name: recherche recherche_id_poste_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recherche
    ADD CONSTRAINT recherche_id_poste_fkey FOREIGN KEY (id_poste) REFERENCES public.fiche_de_poste(id_poste);


--
-- Name: user_ user__id_contact_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_
    ADD CONSTRAINT user__id_contact_fkey FOREIGN KEY (id_contact) REFERENCES public.contact(id_contact);


--
-- Name: veut_aller_a veut_aller_a_id_fiche_de_voeux_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.veut_aller_a
    ADD CONSTRAINT veut_aller_a_id_fiche_de_voeux_fkey FOREIGN KEY (id_fiche_de_voeux) REFERENCES public.fiche_de_voeux(id_fiche_de_voeux);


--
-- Name: veut_aller_a veut_aller_a_id_region_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.veut_aller_a
    ADD CONSTRAINT veut_aller_a_id_region_fkey FOREIGN KEY (id_region) REFERENCES public.region(id_region);


--
-- Name: veut_habiter_dans veut_habiter_dans_id_fiche_de_voeux_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.veut_habiter_dans
    ADD CONSTRAINT veut_habiter_dans_id_fiche_de_voeux_fkey FOREIGN KEY (id_fiche_de_voeux) REFERENCES public.fiche_de_voeux(id_fiche_de_voeux);


--
-- Name: veut_habiter_dans veut_habiter_dans_id_hebergement_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.veut_habiter_dans
    ADD CONSTRAINT veut_habiter_dans_id_hebergement_fkey FOREIGN KEY (id_hebergement) REFERENCES public.hebergement(id_hebergement);


--
-- Name: veut_partir_pour veut_partir_pour_id_duree_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.veut_partir_pour
    ADD CONSTRAINT veut_partir_pour_id_duree_fkey FOREIGN KEY (id_duree) REFERENCES public.duree(id_duree);


--
-- Name: veut_partir_pour veut_partir_pour_id_fiche_de_voeux_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.veut_partir_pour
    ADD CONSTRAINT veut_partir_pour_id_fiche_de_voeux_fkey FOREIGN KEY (id_fiche_de_voeux) REFERENCES public.fiche_de_voeux(id_fiche_de_voeux);


--
-- Name: veut_vivre_dans veut_vivre_dans_id_environnement_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.veut_vivre_dans
    ADD CONSTRAINT veut_vivre_dans_id_environnement_fkey FOREIGN KEY (id_environnement) REFERENCES public.environnement(id_environnement);


--
-- Name: veut_vivre_dans veut_vivre_dans_id_fiche_de_voeux_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.veut_vivre_dans
    ADD CONSTRAINT veut_vivre_dans_id_fiche_de_voeux_fkey FOREIGN KEY (id_fiche_de_voeux) REFERENCES public.fiche_de_voeux(id_fiche_de_voeux);


--
-- PostgreSQL database dump complete
--



-- ============================================================================
-- PARTIE 2 — RÉFÉRENTIELS (source : seed_referentiels.sql)
-- ============================================================================

-- Seed des donnees de reference (referentiel valide DCC)
-- Genere depuis Documents/3 - BDD/referentiels_v3.md le 08/09/2026
-- Complete par 3 sources supplementaires : migrations 005 (type_billet_avion),
-- 011 (aide_contextuelle), et l'ajout de l'etat "Rejet apres affectation" (migration 013)
BEGIN;

-- Region
INSERT INTO public.region (crm_key, designation, active) VALUES
  ('AFS', 'Afrique subsaharienne', TRUE),
  ('MAD', 'Madagascar', TRUE),
  ('PRO', 'Proche-Orient', TRUE),
  ('MAG', 'Maghreb', TRUE),
  ('ASP', 'Asie / Pacifique', TRUE),
  ('AML', 'Amérique latine', TRUE)
ON CONFLICT (crm_key) DO NOTHING;

-- Pays
INSERT INTO public.pays (crm_key, designation, active, id_region) VALUES
  ('SENEGAL', 'Sénégal', TRUE, (SELECT id_region FROM public.region WHERE designation = 'Afrique subsaharienne')),
  ('BENIN', 'Bénin', TRUE, (SELECT id_region FROM public.region WHERE designation = 'Afrique subsaharienne')),
  ('CAMEROUN', 'Cameroun', TRUE, (SELECT id_region FROM public.region WHERE designation = 'Afrique subsaharienne')),
  ('COTE_IVOIRE', 'Côte d''Ivoire', TRUE, (SELECT id_region FROM public.region WHERE designation = 'Afrique subsaharienne')),
  ('RDCONGO', 'République Démocratique du Congo', TRUE, (SELECT id_region FROM public.region WHERE designation = 'Afrique subsaharienne')),
  ('TOGO', 'Togo', TRUE, (SELECT id_region FROM public.region WHERE designation = 'Afrique subsaharienne')),
  ('MADAGASCAR', 'Madagascar', TRUE, (SELECT id_region FROM public.region WHERE designation = 'Madagascar')),
  ('LIBAN', 'Liban', TRUE, (SELECT id_region FROM public.region WHERE designation = 'Proche-Orient')),
  ('JORDANIE', 'Jordanie', TRUE, (SELECT id_region FROM public.region WHERE designation = 'Proche-Orient')),
  ('MAROC', 'Maroc', TRUE, (SELECT id_region FROM public.region WHERE designation = 'Maghreb')),
  ('TUNISIE', 'Tunisie', TRUE, (SELECT id_region FROM public.region WHERE designation = 'Maghreb')),
  ('ALGERIE', 'Algérie', TRUE, (SELECT id_region FROM public.region WHERE designation = 'Maghreb')),
  ('VIETNAM', 'Vietnam', TRUE, (SELECT id_region FROM public.region WHERE designation = 'Asie / Pacifique')),
  ('CAMBODGE', 'Cambodge', TRUE, (SELECT id_region FROM public.region WHERE designation = 'Asie / Pacifique')),
  ('PHILIPPINES', 'Philippines', TRUE, (SELECT id_region FROM public.region WHERE designation = 'Asie / Pacifique')),
  ('PEROU', 'Pérou', TRUE, (SELECT id_region FROM public.region WHERE designation = 'Amérique latine')),
  ('BOLIVIE', 'Bolivie', TRUE, (SELECT id_region FROM public.region WHERE designation = 'Amérique latine')),
  ('HAITI', 'Haïti', FALSE, (SELECT id_region FROM public.region WHERE designation = 'Amérique latine')),
  ('GUATEMALA', 'Guatemala', TRUE, (SELECT id_region FROM public.region WHERE designation = 'Amérique latine')),
  ('MEXIQUE', 'Mexique', TRUE, (SELECT id_region FROM public.region WHERE designation = 'Amérique latine')),
  ('EQUATEUR', 'Equateur', TRUE, (SELECT id_region FROM public.region WHERE designation = 'Amérique latine')),
  ('ARGENTINE', 'Argentine', TRUE, (SELECT id_region FROM public.region WHERE designation = 'Amérique latine')),
  ('CHILI', 'Chili', TRUE, (SELECT id_region FROM public.region WHERE designation = 'Amérique latine')),
  ('BRESIL', 'Brésil', TRUE, (SELECT id_region FROM public.region WHERE designation = 'Amérique latine')),
  ('COLOMBIE', 'Colombie', TRUE, (SELECT id_region FROM public.region WHERE designation = 'Amérique latine')),
  ('INDE', 'Inde', TRUE, (SELECT id_region FROM public.region WHERE designation = 'Asie / Pacifique')),
  ('VANUATU', 'Vanuatu', TRUE, (SELECT id_region FROM public.region WHERE designation = 'Asie / Pacifique')),
  ('THAILANDE', 'Thaïlande', TRUE, (SELECT id_region FROM public.region WHERE designation = 'Asie / Pacifique')),
  ('JERUSALEM', 'Jérusalem', TRUE, (SELECT id_region FROM public.region WHERE designation = 'Proche-Orient')),
  ('PALESTINE', 'Palestine', TRUE, (SELECT id_region FROM public.region WHERE designation = 'Proche-Orient')),
  ('GUINEE_CONAKRY', 'Guinée Conakry', TRUE, (SELECT id_region FROM public.region WHERE designation = 'Afrique subsaharienne')),
  ('CONGO', 'Congo', TRUE, (SELECT id_region FROM public.region WHERE designation = 'Afrique subsaharienne')),
  ('RWANDA', 'Rwanda', TRUE, (SELECT id_region FROM public.region WHERE designation = 'Afrique subsaharienne')),
  ('BURUNDI', 'Burundi', TRUE, (SELECT id_region FROM public.region WHERE designation = 'Afrique subsaharienne')),
  ('TANZANIE', 'Tanzanie', TRUE, (SELECT id_region FROM public.region WHERE designation = 'Afrique subsaharienne')),
  ('TCHAD', 'Tchad', TRUE, (SELECT id_region FROM public.region WHERE designation = 'Afrique subsaharienne')),
  ('OUGANDA', 'Ouganda', TRUE, (SELECT id_region FROM public.region WHERE designation = 'Afrique subsaharienne')),
  ('GHANA', 'Ghana', TRUE, (SELECT id_region FROM public.region WHERE designation = 'Afrique subsaharienne')),
  ('GABON', 'Gabon', TRUE, (SELECT id_region FROM public.region WHERE designation = 'Afrique subsaharienne')),
  ('DJIBOUTI', 'Djibouti', TRUE, (SELECT id_region FROM public.region WHERE designation = 'Afrique subsaharienne')),
  ('MAURITANIE', 'Mauritanie', TRUE, (SELECT id_region FROM public.region WHERE designation = 'Afrique subsaharienne')),
  ('EGYPTE', 'Egypte', TRUE, (SELECT id_region FROM public.region WHERE designation = 'Proche-Orient'))
ON CONFLICT (crm_key) DO NOTHING;

-- Duree de mission
INSERT INTO public.duree (crm_key, periode, statut, niveau, active) VALUES
  ('11M', 'jusqu''à 11 mois', 'Benevolat', 1, TRUE),
  ('1AN', '1 an', 'VSI', 2, TRUE),
  ('2AN', '2 ans', 'VSI', 3, TRUE),
  ('1A+', '1 an renouvelable', 'VSI', 2.5, TRUE),
  ('AUTRE', 'Autre', 'Autre', NULL, FALSE),
  ('18M', '18 mois', 'VSI', 2.5, TRUE)
ON CONFLICT (crm_key) DO NOTHING;

-- Environnement
INSERT INTO public.environnement (crm_key, designation, niveau, active) VALUES
  ('UGV', 'Urbain, grande ville', 1, TRUE),
  ('UPV', 'Urbain petite ville', 2, TRUE),
  ('RPV', 'Rural proche de ville', 3, TRUE),
  ('RUI', 'Rural isolé', 4, TRUE)
ON CONFLICT (crm_key) DO NOTHING;

-- Hebergement
INSERT INTO public.hebergement (crm_key, designation, active) VALUES
  ('LOS', 'Logement seul', TRUE),
  ('COL', 'Colocation', TRUE),
  ('VCR', 'Vie avec communauté religieuse', TRUE)
ON CONFLICT (crm_key) DO NOTHING;

-- Langue
INSERT INTO public.langue (crm_key, designation, active) VALUES
  ('FR', 'Français', TRUE),
  ('ANG', 'Anglais', TRUE),
  ('ESP', 'Espagnol', TRUE),
  ('POR', 'Portugais', TRUE),
  ('ITA', 'Italien', TRUE),
  ('ALL', 'Allemand', TRUE),
  ('ARA', 'Arabe', TRUE)
ON CONFLICT (crm_key) DO NOTHING;

-- Niveau de langue
-- NB: crm_key absent du referentiel source, propose ici (a valider) :
INSERT INTO public.niveau_langue (crm_key, designation, ordre, active) VALUES
  ('NOTIONS', 'Notions', 1, TRUE),
  ('PARLE', 'Parlé', 2, TRUE),
  ('COURANT', 'Courant', 3, TRUE),
  ('NATIF', 'Natif', 4, TRUE)
ON CONFLICT (crm_key) DO NOTHING;

-- Domaines
INSERT INTO public.domaine (crm_key, designation, active) VALUES
  ('SANTE', 'Santé', TRUE),
  ('ENSEIGNEMENT', 'Enseignement', TRUE),
  ('EDUCATION', 'Education - Animation', TRUE),
  ('INGENIERIE_TECHNIQUE', 'Ingénierie - Technique', TRUE),
  ('ENVIRONNEMENT', 'Rural - Environnement', TRUE),
  ('GESTION_PROJET', 'Gestion de projet', TRUE),
  ('COMMUNICATION', 'Communication', TRUE),
  ('JURIDIQUE', 'Juridique', TRUE),
  ('COMMERCE', 'Commerce - Marketing', TRUE),
  ('INFORMATIQUE', 'Informatique', TRUE),
  ('GESTION_ENTREPRISE', 'Gestion de l''entreprise', TRUE),
  ('FINANCES', 'Finances', FALSE),
  ('TECHNIQUE', 'Technique', FALSE),
  ('RECH_FONDS', 'Recherche de fonds', FALSE),
  ('RH', 'Ressources humaines', FALSE),
  ('INGENIERIE', 'Ingénierie', FALSE)
ON CONFLICT (crm_key) DO NOTHING;

-- Competences
INSERT INTO public.competences (crm_key, designation, active, id_domaine) VALUES
  ('COMMERCIAL', 'Commercial', TRUE, (SELECT id_domaine FROM public.domaine WHERE designation = 'Commerce - Marketing')),
  ('MARKETING', 'Marketing', TRUE, (SELECT id_domaine FROM public.domaine WHERE designation = 'Commerce - Marketing')),
  ('FORMATION_COM', 'Enseignement communication', TRUE, (SELECT id_domaine FROM public.domaine WHERE designation = 'Enseignement')),
  ('COMMUNICATION', 'Communication générale', TRUE, (SELECT id_domaine FROM public.domaine WHERE designation = 'Communication')),
  ('TECH_AV', 'Technicien audio/vidéo', TRUE, (SELECT id_domaine FROM public.domaine WHERE designation = 'Communication')),
  ('RESEAUX_SOC', 'Réseaux sociaux', TRUE, (SELECT id_domaine FROM public.domaine WHERE designation = 'Communication')),
  ('ANIMATION_CULTURELLE', 'Animation culturelle / bibliothèque', TRUE, (SELECT id_domaine FROM public.domaine WHERE designation = 'Education - Animation')),
  ('ANIMATION_PASTORALE', 'Animation pastorale', TRUE, (SELECT id_domaine FROM public.domaine WHERE designation = 'Education - Animation')),
  ('PROMOTION_FEMININE', 'Promotion féminine', TRUE, (SELECT id_domaine FROM public.domaine WHERE designation = 'Education - Animation')),
  ('PERS_HANDICAP', 'Personnes handicapées', TRUE, (SELECT id_domaine FROM public.domaine WHERE designation = 'Education - Animation')),
  ('JEUNES', 'Jeunes', TRUE, (SELECT id_domaine FROM public.domaine WHERE designation = 'Education - Animation')),
  ('EDUC_SPE', 'Éducation spécialisée', TRUE, (SELECT id_domaine FROM public.domaine WHERE designation = 'Education - Animation')),
  ('SOUTIEN_SCOLAIRE', 'Soutien scolaire', TRUE, (SELECT id_domaine FROM public.domaine WHERE designation = 'Enseignement')),
  ('ENS_PRIMAIRE', 'Enseignement primaire', TRUE, (SELECT id_domaine FROM public.domaine WHERE designation = 'Enseignement')),
  ('DIRECTION_ECOLE', 'Direction d''école', TRUE, (SELECT id_domaine FROM public.domaine WHERE designation = 'Enseignement')),
  ('CONSEIL_PEDAGOGIQUE', 'Conseil pédagogique', TRUE, (SELECT id_domaine FROM public.domaine WHERE designation = 'Enseignement')),
  ('ENS_SEC_LANG', 'Enseignement secondaire (langues)', TRUE, (SELECT id_domaine FROM public.domaine WHERE designation = 'Enseignement')),
  ('ENS_UNIV_LANG', 'Enseignement universitaire (langues)', TRUE, (SELECT id_domaine FROM public.domaine WHERE designation = 'Enseignement')),
  ('ENS_TECHNIQUE', 'Enseignement secondaire (technique)', TRUE, (SELECT id_domaine FROM public.domaine WHERE designation = 'Enseignement')),
  ('ENS_UNIV_TECHNIQUE', 'Enseignement universitaire (technique, ingé)', TRUE, (SELECT id_domaine FROM public.domaine WHERE designation = 'Enseignement')),
  ('ENSEIGNEMENT_GESTION', 'Enseignement (gestion de projet)', TRUE, (SELECT id_domaine FROM public.domaine WHERE designation = 'Enseignement')),
  ('ENS_SECONDAIRE_SCI', 'Enseignement secondaire (sciences)', TRUE, (SELECT id_domaine FROM public.domaine WHERE designation = 'Enseignement')),
  ('ENS_UNIV_SCI', 'Enseignement universitaire (sciences)', TRUE, (SELECT id_domaine FROM public.domaine WHERE designation = 'Enseignement')),
  ('ENS_AGRICOLE', 'Enseignement agricole', TRUE, (SELECT id_domaine FROM public.domaine WHERE designation = 'Enseignement')),
  ('ENSEIGNEMENT_ECO', 'Enseignement (éco/sc. humaines/jur.)', TRUE, (SELECT id_domaine FROM public.domaine WHERE designation = 'Enseignement')),
  ('FORMATION_PRO', 'Formation professionnelle', TRUE, (SELECT id_domaine FROM public.domaine WHERE designation = 'Enseignement')),
  ('AGRICULTURE', 'Agriculture', TRUE, (SELECT id_domaine FROM public.domaine WHERE designation = 'Rural - Environnement')),
  ('SENSIBILISATION_ENV', 'Sensibilisation environnement', TRUE, (SELECT id_domaine FROM public.domaine WHERE designation = 'Rural - Environnement')),
  ('AGRONOMIE', 'Agronomie', TRUE, (SELECT id_domaine FROM public.domaine WHERE designation = 'Rural - Environnement')),
  ('HYDRAULIQUE', 'Hydraulique', TRUE, (SELECT id_domaine FROM public.domaine WHERE designation = 'Rural - Environnement')),
  ('COMPTA_FINANCES', 'Gestion financière', TRUE, (SELECT id_domaine FROM public.domaine WHERE designation = 'Gestion de l''entreprise')),
  ('GESTION_RH', 'Gestion des ressources humaines', TRUE, (SELECT id_domaine FROM public.domaine WHERE designation = 'Gestion de l''entreprise')),
  ('MANAGEMENT_EQUIPE', 'Management', TRUE, (SELECT id_domaine FROM public.domaine WHERE designation = 'Gestion de l''entreprise')),
  ('COMPTA', 'Comptabilité', TRUE, (SELECT id_domaine FROM public.domaine WHERE designation = 'Gestion de projet')),
  ('DIRECTION', 'Direction de projet', TRUE, (SELECT id_domaine FROM public.domaine WHERE designation = 'Gestion de projet')),
  ('ADMIN_SECRETARIAT', 'Administratif, secrétariat', TRUE, (SELECT id_domaine FROM public.domaine WHERE designation = 'Gestion de projet')),
  ('RECHERCHE_FONDS', 'Recherche de fonds', TRUE, (SELECT id_domaine FROM public.domaine WHERE designation = 'Gestion de projet')),
  ('SUIVI_PROJET', 'Suivi de projet', TRUE, (SELECT id_domaine FROM public.domaine WHERE designation = 'Gestion de projet')),
  ('JURIDIQUE', 'Juridique', TRUE, (SELECT id_domaine FROM public.domaine WHERE designation = 'Juridique')),
  ('MEDECINE', 'Médecine', TRUE, (SELECT id_domaine FROM public.domaine WHERE designation = 'Santé')),
  ('SOINS_INFIRMIERS', 'Soins infirmiers / aide aux soins', TRUE, (SELECT id_domaine FROM public.domaine WHERE designation = 'Santé')),
  ('PARAMEDICAL', 'Paramédical', TRUE, (SELECT id_domaine FROM public.domaine WHERE designation = 'Santé')),
  ('PSYCHOLOGIE', 'Psychologie', TRUE, (SELECT id_domaine FROM public.domaine WHERE designation = 'Santé')),
  ('COORDINATION_CENTRE', 'Coordination d''un centre', TRUE, (SELECT id_domaine FROM public.domaine WHERE designation = 'Santé')),
  ('PERSONNES_AGEES', 'Personnes âgées', TRUE, (SELECT id_domaine FROM public.domaine WHERE designation = 'Education - Animation')),
  ('CONSTRUCTION', 'Construction', TRUE, (SELECT id_domaine FROM public.domaine WHERE designation = 'Ingénierie - Technique')),
  ('TECHNICIEN', 'Technicien', TRUE, (SELECT id_domaine FROM public.domaine WHERE designation = 'Ingénierie - Technique')),
  ('TECHNICIEN_INFO', 'Technicien informatique', TRUE, (SELECT id_domaine FROM public.domaine WHERE designation = 'Informatique')),
  ('GESTION_RESEAUX', 'Gestion de réseaux informatiques', TRUE, (SELECT id_domaine FROM public.domaine WHERE designation = 'Informatique')),
  ('GESTION_LOGICIEL', 'Gestion logicielle', TRUE, (SELECT id_domaine FROM public.domaine WHERE designation = 'Informatique')),
  ('LOGICIEL_SPECIFIQUE', 'Maîtrise logiciel(s) spécifique(s)', TRUE, (SELECT id_domaine FROM public.domaine WHERE designation = 'Informatique')),
  ('SOINS', 'Soins', FALSE, (SELECT id_domaine FROM public.domaine WHERE designation = 'Santé')),
  ('FORMATION_SANTE', 'Formation', FALSE, (SELECT id_domaine FROM public.domaine WHERE designation = 'Santé')),
  ('COMMERCIAL_MARKETING', 'Commercial, marketing', FALSE, (SELECT id_domaine FROM public.domaine WHERE designation = 'Communication'))
ON CONFLICT (crm_key) DO NOTHING;

-- Notoriete DCC
-- NB: crm_key absent du referentiel source, propose ici (a valider) :
INSERT INTO public.notoriete_dcc (crm_key, designation, active) VALUES
  ('MISSION_PRE_AFFECTEE', 'Mission pré-affectée', TRUE),
  ('BOUCHE_A_OREILLE', 'Bouche à oreille', TRUE),
  ('INTERNET', 'Internet', TRUE),
  ('RESEAUX_SOCIAUX', 'Réseaux sociaux', TRUE),
  ('OFFRE_VOLONTARIAT_ANNONCES', 'Offre de volontariat (annonces publiées en ligne)', TRUE),
  ('MEDIA_PRESSE_RADIO_TV', 'Média (presse, radio, TV)', TRUE),
  ('STAND_DCC_EGLISE', 'Sur un stand DCC (événement en Eglise)', TRUE),
  ('STAND_DCC_HORS_EGLISE', 'Sur un stand DCC (événement hors Eglise)', TRUE),
  ('TEMOIGNAGE_SCOLAIRE_UNIV', 'Témoignage - milieu scolaire ou université', TRUE),
  ('TEMOIGNAGE_PAROISSE_EGLISE', 'Témoignage - paroisse ou mouvement d''Eglise', TRUE),
  ('TEMOIGNAGE_RASSEMBLEMENT', 'Témoignage - grand rassemblement', TRUE),
  ('TEMOIGNAGE_AUTRE', 'Témoignage - autre', TRUE),
  ('AUTRE', 'Autre', TRUE)
ON CONFLICT (crm_key) DO NOTHING;

-- Etat Poste
INSERT INTO public.etat_poste (designation, active) VALUES
  ('À pourvoir', TRUE),
  ('Pré-affecté', TRUE),
  ('Pré-réservé', TRUE),
  ('Réservé', TRUE),
  ('Pourvu', TRUE),
  ('Fermé', TRUE)
ON CONFLICT DO NOTHING;

-- Etat Candidat
INSERT INTO public.etat_candidat (id_etat_candidat, designation, active, delais_de_reponse) VALUES
  ('CRE', 'Candidat créé', TRUE, 7),
  ('NEL', 'Non éligible', TRUE, NULL),
  ('AP1', '1er appel téléphonique', TRUE, 14),
  ('AP2', '2ème appel téléphonique', TRUE, 21),
  ('CHO', 'Session choisir', TRUE, 14),
  ('NCA', 'Non candidat', TRUE, NULL),
  ('ATA', 'Attente affectation', TRUE, NULL),
  ('MEL', 'Mis en lien', TRUE, 5),
  ('ACP', 'Accord de principe', TRUE, NULL),
  ('ACC', 'Accepté', TRUE, 8),
  ('AFF', 'Affecté', TRUE, NULL)
ON CONFLICT (id_etat_candidat) DO NOTHING;

-- Etat Opportunite
INSERT INTO public.etat_opportunite (designation, active) VALUES
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
  ('Obsolète', TRUE),
  ('Rejet après affectation', TRUE)
ON CONFLICT DO NOTHING;

-- Type billet avion (source: migration 005_type_billet_avion.sql)
INSERT INTO public.type_billet_avion (crm_key, designation, active) VALUES
  ('PARTENAIRE', 'Partenaire', TRUE),
  ('DCC', 'DCC', TRUE),
  ('VOLONTAIRE', 'Volontaire', TRUE)
ON CONFLICT (crm_key) DO NOTHING;

-- Aide contextuelle (source: migrations 010_voeux_ux.sql, 011_opportunite_scoring_aides.sql et
-- 018_aide_contextuelle_voeux_texte.sql — les 23 premières lignes ci-dessous, tooltips de la fiche
-- de vœux, étaient absentes de ce script avant le 23/09/2026 (Retour_23) : elles existaient bien en
-- migration 010 mais n'avaient jamais été reportées ici, donc jamais recréées sur une base réinitialisée
-- depuis ce fichier)
INSERT INTO public.aide_contextuelle (cle_champ, texte, active) VALUES
  ('domaines_formation', 'Précise le ou les domaines dans lesquels tu as suivi une formation ou obtenu un diplôme. Cela aide à te proposer des postes en lien avec ton parcours.', TRUE),
  ('domaines_experience', 'Précise le ou les domaines dans lesquels tu as une expérience professionnelle ou bénévole, même sans diplôme associé.', TRUE),
  ('profil_experience_engagement_detail', 'Décris en quelques mots tes engagements associatifs, professionnels ou bénévoles passés : structure, durée, missions confiées.', TRUE),
  ('langues', 'Indique les langues que tu parles et ton niveau pour chacune (Notions, Parlé, Courant, Natif) : cela permet de te proposer des missions où tu pourras communiquer.', TRUE),
  ('date_depart_souhaite', 'Indique la date à partir de laquelle tu es disponible pour partir. Plus elle est proche de la date attendue par un poste, mieux la mission te correspond.', TRUE),
  ('durees', 'Sélectionne la ou les durées de mission qui te conviennent (par exemple 6 mois, 1 an, 2 ans...). Tu peux en choisir plusieurs.', TRUE),
  ('fonctionnaire_dispo_demandee', 'Si tu es fonctionnaire, précise si tu as demandé, ou si tu vas demander, une disponibilité à ton administration pour partir en mission.', TRUE),
  ('nouvelle_langue', 'Indique si tu es prêt à apprendre une nouvelle langue pour ta mission, même si tu ne la parles pas encore aujourd''hui.', TRUE),
  ('nouveau_poste', 'Indique si tu es prêt à occuper un poste différent de ton métier ou de ta formation d''origine.', TRUE),
  ('environnements', 'Précise le type de cadre de vie que tu préfères (urbain, rural, grande ville...). Tu peux en choisir plusieurs.', TRUE),
  ('hebergements', 'Précise le type de logement qui te convient sur place (seul, colocation, en famille...).', TRUE),
  ('zone_orange', 'Indique si tu acceptes d''être affecté dans une zone signalée comme présentant un risque particulier (zone orange).', TRUE),
  ('conditions_spartiates', 'Indique si tu acceptes des conditions de vie sommaires sur ta mission (accès limité au confort, à l''eau, à l''électricité...).', TRUE),
  ('hopital_proche', 'Indique si tu as besoin d''être à proximité d''un hôpital pour des raisons de santé, les tiennes ou celles d''un proche qui t''accompagne.', TRUE),
  ('regions', 'Précise en face de chaque région si tu souhaites ou non y aller. Tu peux aussi indiquer un ordre de préférence en utilisant les valeurs P1 (préférée) à P6.', TRUE),
  ('competences', 'Indique les compétences que tu peux mettre au service d''une mission, et ton niveau pour chacune, pour te proposer des postes qui correspondent vraiment à ce que tu sais faire.', TRUE),
  ('competences_a_developper', 'Précise si tu souhaites profiter de ta mission pour apprendre ou développer une compétence en particulier.', TRUE),
  ('centres_interret', 'Indique tes centres d''intérêt personnels (sport, musique, artisanat...) : cela aide à mieux cerner ton profil au-delà de ton parcours professionnel.', TRUE),
  ('part_seul', 'Indique si le candidat part seul ou accompagné (couple, famille) — utile pour évaluer la compatibilité avec le logement proposé par le poste.', TRUE),
  ('annonces_recherchees', 'Note ici les annonces de postes que le candidat a lui-même repérées et transmises, en dehors des correspondances calculées automatiquement.', TRUE),
  ('engagements', 'Note ici les engagements associatifs ou professionnels du candidat identifiés par le chargé de recrutement, en complément du détail donné par le candidat lui-même.', TRUE),
  ('categorie_ecclesiale', 'Indique si le candidat est sensible à la démarche ecclésiale du partenaire d''accueil.', TRUE),
  ('categorie_ecclesiale_detail', 'Précise, si besoin, la nature de l''engagement ou de la sensibilité ecclésiale du candidat.', TRUE),
  ('score_note_mission', 'Cette note évalue si les compétences du candidat correspondent aux compétences demandées par le poste. Elle atteint son maximum si le candidat possède toutes les compétences demandées.', TRUE),
  ('score_competences', 'Note maximale si le candidat possède toutes les compétences demandées par le poste. Note un peu plus basse s''il en possède au moins une. Note intermédiaire s''il a étudié ou travaillé dans le même domaine sans avoir la compétence précise. Note nulle sinon.', TRUE),
  ('score_note_contexte', 'Cette note est la moyenne de 6 critères qui mesurent si les conditions de vie et d''organisation du poste correspondent aux souhaits du candidat : la région, la date de départ, le type d''environnement, le logement, la durée de la mission et la langue. Plus la moyenne est élevée, plus les conditions générales sont compatibles.', TRUE),
  ('score_region', 'Compare la région du poste à la préférence exprimée par le candidat pour cette région (de "n''y va pas" à "1er choix"). Plus la région est un choix prioritaire pour le candidat, plus la note est élevée.', TRUE),
  ('score_date_depart', 'Compare la date à laquelle le candidat peut partir à la date d''arrivée souhaitée par le poste. Plus l''écart entre les deux dates est faible, plus la note est élevée ; elle est maximale si les deux dates correspondent exactement.', TRUE),
  ('score_environnement', 'Compare le milieu de vie du poste (urbain, rural...) aux milieux de vie acceptés par le candidat. Note maximale en cas de correspondance exacte, note réduite si l''écart est faible, note nulle sinon.', TRUE),
  ('score_logement_couple', 'Vérifie si le logement proposé par le poste correspond à la situation du candidat. S''il part seul, vérifie que le logement lui convient. S''il part en couple ou en famille, vérifie que le poste permet également un poste ou un accueil pour la personne qui l''accompagne.', TRUE),
  ('score_duree', 'Compare la durée de la mission proposée par le poste aux durées acceptées par le candidat. Note maximale en cas de correspondance exacte, note réduite si l''écart est faible, note nulle sinon.', TRUE),
  ('score_langue', 'Vérifie si le candidat parle la langue requise par le poste, et à quel niveau. Une note intermédiaire est accordée si le candidat est prêt à apprendre une nouvelle langue.', TRUE),
  ('score_note_alerte', 'Ce pictogramme signale un point de vigilance sur 3 critères sensibles : la zone à risque, la proximité d''un hôpital et des conditions de vie sommaires. Vert : aucun point de vigilance. Jaune : un point existe mais le candidat l''a accepté. Rouge : un point existe et n''est pas couvert — à examiner avant de poursuivre.', TRUE),
  ('score_zone_orange', 'Signale si le poste est situé dans une zone jugée à risque, et si le candidat a accepté ou non cette condition.', TRUE),
  ('score_hopital_proche', 'Signale si le candidat a besoin d''être proche d''un hôpital pour des raisons de santé, et si le poste répond ou non à ce besoin.', TRUE),
  ('score_conditions_spartiates', 'Signale si le poste implique des conditions de vie sommaires, et si le candidat a accepté ou non cette condition.', TRUE)
ON CONFLICT (cle_champ) DO UPDATE SET texte = EXCLUDED.texte, active = EXCLUDED.active;

COMMIT;
