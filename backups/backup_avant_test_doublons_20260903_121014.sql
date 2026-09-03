--
-- PostgreSQL database dump
--

\restrict iYOMFFqaW67AqSkuYyxbBxWfNG4QFbkDG2p3NNE98IEvMvzOZDRJmhGbE3QI13l

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
    id_pays integer NOT NULL
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
    valeur_poste character varying(50),
    valeur_candidat character varying(50),
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
    fonctionnaire_dispo_demandee boolean,
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
    date_verrouillage date
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
    appreciation_recruteur character varying(100),
    commentaire_charge_mission character varying(100),
    id_etat_opportunite integer NOT NULL,
    id_poste integer NOT NULL,
    id_fiche_de_voeux integer NOT NULL,
    flag_opportunite_obsolete boolean DEFAULT false NOT NULL
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
    password_reset_nonce_hash character varying(64)
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
-- Data for Name: a_etudie_dans; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.a_etudie_dans (id_fiche_de_voeux, id_domaine) FROM stdin;
17	31
18	22
20	34
19	31
19	32
21	25
21	39
24	25
25	43
26	40
23	25
23	22
\.


--
-- Data for Name: a_la_competence_de; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.a_la_competence_de (id_fiche_de_voeux, id_competences, niveau, autre_competence) FROM stdin;
19	40	Intermédiaire	\N
19	46	Expert	\N
22	39	Débutant	\N
23	75	Intermédiaire	\N
23	45	Débutant	\N
21	36	Débutant	\N
21	67	Intermédiaire	\N
21	55	Débutant	\N
21	46	Intermédiaire	\N
\.


--
-- Data for Name: a_travaille_dans; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.a_travaille_dans (id_fiche_de_voeux, id_domaine) FROM stdin;
18	22
20	34
19	32
21	39
24	25
25	43
26	40
23	22
\.


--
-- Data for Name: adresse; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.adresse (id_adresse, adresse1, adresse2, code_postal, ville, id_pays) FROM stdin;
3	12 rue de la Mission	\N	10000	Dakar	37
4	45 avenue des Partenaires	\N	20000	Cotonou	38
5	8 rue Centrale	\N	30000	Antananarivo	43
19	10 rue des Lilas	\N	69000	Lyon	37
20	25 avenue Victor Hugo	Bât B	44000	Nantes	38
21	8 impasse des Cerisiers	\N	31000	Toulouse	43
22	3 rue de Bretagne	\N	35000	Rennes	39
25	18 avenue de la Republique	Bât C	59000	Lille	61
26	7 impasse des Vergers	\N	35000	Rennes	49
27	22 rue du Marché	\N	31000	Toulouse	46
23	17 rue Kléber	\N	67000	Strasbourg	44
24	5 rue des Tilleuls	\N	44000	Nantes	37
\.


--
-- Data for Name: candidat; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.candidat (id_candidat, web_key, crm_key, trigram_candidat, engagements, annonces_recherchees, perso_depart_en_couple, perso_nom_prenom_conjoint, perso_etat_de_vie, perso_date_mariage, perso_est_parent, perso_pars_avec_enfants, projet_date_depart_souhaitee, projet_numero_offre_mission, projet_motivations, projet_questionnements, projet_avancement, projet_experience_interculturelle, projet_formation_dialogue_interculturel, projet_experience_de_volontariat, projet_raison_du_depart_avec_la_dcc, projet_attente_de_la_dcc, projet_lien_avec_une_autre_structure, projet_lien_avec_une_autre_structure_detail, profil_statut, profil_statut_administration_de_tutelle, profil_experience_engagement, profil_experience_engagement_detail, candidature_information_du_candidat, candidature_disponibilite_du_candidat, candidature_preference_session_choisir, id_etat_candidat, id_contact, date_revue, date_revue_modifiee_par, date_revue_modifiee_le, projet_duree_mission_souhaitee, perso_enfants_consolides) FROM stdin;
46	TEST_IMPORT_05	\N	\N	\N	\N	f		Célibataire	2026-08-03	f	f	2026-09-01		Fonctionnaire, je souhaite mettre à profit ma disponibilité pour un engagement solidaire d'un an.		Démarche de détachement déjà engagée auprès de mon administration.	Mission humanitaire de 2 semaines en Jordanie il y a 3 ans.	Oui	Bénévole association d'aide aux migrants depuis 4 ans.	M'investir pleinement dans un rôle de coordination sur le terrain.	Un accompagnement pour la démarche de détachement administratif.	t	Membre active d'une association d'aide aux migrants, intervention hebdomadaire.	Fonctionnaire	Éducation nationale	t	Coordination d'équipe bénévole et gestion de projet associatif depuis 4 ans.		Disponible sur rendez-vous, horaires de bureau.	Session d'octobre souhaitée.	CHO	62	2026-09-11	\N	\N	\N	\N
45	TEST_IMPORT_04	\N	\N	\N	\N	f	ddfgdfg	Célibataire	\N	f	f	2027-01-01	\N	Je souhaite tester une première mission courte avant de m'engager plus durablement.	\N	Premier contact avec la DCC, dossier en cours de constitution.	Aucune expérience interculturelle longue à ce jour.	\N	\N	Découvrir le terrain avant un engagement de plus long terme.	Un retour rapide sur la faisabilité d'une mission courte.	f	\N	Indépendant	\N	f	\N	\N	Disponible avec un préavis de 1 mois.	Pas de préférence de session.	AP2	61	2026-09-17	\N	\N	\N	\N
48	TEST_USER_02	\N	\N	\N	\N	t	Julie Petit	Marié	2014-06-14	f	f	2027-03-01	\N	Nous souhaitons partir en couple sur une mission de gestion de projet d'un an et demi.	\N	Démarche partagée avec mon épouse, dossier en cours de finalisation.	Expatriation professionnelle de 3 ans en Amérique latine.	Oui	\N	Continuer un engagement associatif déjà commencé sur place.	Un poste compatible avec un départ en couple.	f	\N	Indépendant	\N	t	Coordination d'une association de solidarité internationale depuis 5 ans.	\N	Disponible sur rendez-vous, horaires flexibles.	Session de mars ou juin selon disponibilité.	AP2	64	2026-09-22	\N	\N	18 mois	\N
44	TEST_IMPORT_03	\N	\N	\N	\N	f	Marc Girard	Marié	2012-08-20	t	t	2026-06-01	\N	Nous partons en famille, nos enfants seront scolarisés sur place.	Quel accompagnement scolaire est prévu pour les enfants sur place ?	Départ en famille déjà validé en interne, reste la fiche de vœux à finaliser.	Vécu 6 mois au Maroc lors d'un précédent engagement associatif.	\N	\N	Transmettre notre expérience éducative dans un contexte différent.	Des informations claires sur la scolarisation des enfants.	f	\N	Sans emploi	\N	f	\N	Départ en famille avec 2 enfants (8 et 11 ans).	Disponible en journée uniquement.	Session de juin, contrainte par le calendrier scolaire.	CHO	60	2026-09-14	Démo Recruteur	2026-08-27	\N	\N
49	TEST_USER_03	\N	\N	\N	\N	f	Marc Durand	Marié	2016-07-25	t	t	2026-06-01	\N	Nous partons en famille, nos deux enfants seront scolarisés sur place.	Quel accompagnement scolaire est prévu pour les enfants sur place ?	Départ en famille déjà validé en interne, reste la fiche de vœux à finaliser.	Vécu 1 an en Asie du Sud-Est lors d'un précédent poste.	\N	\N	Transmettre notre expérience technique dans un contexte différent.	Des informations claires sur la scolarisation des enfants.	f	\N	Salarié	\N	f	\N	Départ en famille avec 2 enfants.	Disponible en journée uniquement.	Session de juin, contrainte par le calendrier scolaire.	AP2	65	2026-09-22	\N	\N	2 ans	[{"nom":"Durand","prenom":"Nolan","genre":"M","date_naissance":"11/03/2016"},{"nom":"Durand","prenom":"Lina","genre":"F","date_naissance":"27/09/2019"}]
31	\N	TEST_CAN_DEMO	DEM	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ATA	47	2026-09-30	Démo Recruteur	2026-08-27	\N	\N
47	TEST_USER_01	\N	\N	dfghdgf	dfgh	f	\N	Célibataire	\N	f	f	2026-10-01		Je souhaite mettre mes compétences en soins au service d'une mission de terrain.		Dossier complet, disponible dès octobre.	Aucune expérience interculturelle longue à ce jour.	qfdgsd		Envie de m'engager dans la durée sur un projet de santé communautaire.	Un accompagnement clair sur les conditions de vie sur place.	t		Salarié		f			Disponible en journée, semaine uniquement.	Session d'octobre souhaitée.	AP2	63	2026-09-26	Démo Recruteur	2026-09-01	1 an	\N
42	TEST_IMPORT_01	\N	\N	\N	\N	f	\N	Célibataire	\N	f	f	2026-09-01	\N	Envie de mettre mes compétences pédagogiques au service d'un projet de solidarité internationale.	\N	Projet mûri depuis plus d'un an, disponible dès la rentrée 2026.	Aucune expérience interculturelle longue à ce jour, mais plusieurs voyages associatifs courts.	\N	\N	Envie de vivre une expérience de terrain en cohérence avec mes valeurs.	Un accompagnement clair sur les démarches administratives.	f	\N	Salarié	\N	f	\N	\N	Disponible en semaine, le soir de préférence.	Session de juin ou octobre selon disponibilité.	AP2	58	2026-09-17	\N	\N	\N	\N
43	TEST_IMPORT_02	\N	\N	\N	\N	t	Julie Lefevre	Marié	2015-06-12	f	f	2027-03-01	\N	Nous souhaitons vivre une mission longue en tant que couple, dans le secteur de la santé.	\N	Démarche partagée avec mon épouse, dossier complet côté DCC déjà entamé.	Expatriation professionnelle de 2 ans en Afrique de l'Ouest il y a 5 ans.	Oui	\N	Continuer un engagement déjà commencé dans le soin.	Un poste compatible avec un départ en couple.	f	\N	Salarié	\N	t	Bénévolat régulier en dispensaire local depuis 3 ans.	\N	Disponible à tout moment, dossier prioritaire.	Session de mars de préférence.	AP2	59	2026-09-17	\N	\N	\N	\N
50	TEST_USER_04	\N	\N	\N	\N	t	Sophie Moreau	Marié	2013-05-02	t	f	2026-09-01	\N	Juriste de formation, je souhaite mettre mon expérience au service d'une mission longue.	\N	Dossier en cours de constitution, premier contact avec la DCC.	Aucune expérience interculturelle longue à ce jour.	\N	\N	Envie de m'investir durablement dans un projet de solidarité internationale.	Un accompagnement juridique sur les démarches d'expatriation.	f	\N	Fonctionnaire	Ministère de la Justice	f	\N	Enfant majeur, ne partira pas avec nous.	Disponible sur rendez-vous, horaires de bureau.	Pas de préférence de session.	AP2	66	2026-09-22	\N	\N	1 an renouvelable	not a valid json
\.


--
-- Data for Name: competences; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.competences (id_competences, crm_key, designation, active, id_domaine) FROM stdin;
68	COMPTA	Comptabilité	t	25
51	FORMATION_COM	Enseignement communication	t	31
39	COMPTA_FINANCES	Gestion financière	t	44
36	MANAGEMENT_EQUIPE	Management	t	44
38	COMMERCIAL_MARKETING	Commercial, marketing	f	38
26	SOINS	Soins	f	22
27	FORMATION_SANTE	Formation	f	22
22	SOUTIEN_SCOLAIRE	Soutien scolaire	t	31
60	COMMERCIAL	Commercial	t	42
61	MARKETING	Marketing	t	42
63	ENS_UNIV_TECHNIQUE	Enseignement universitaire (technique, ingé)	t	31
64	FORMATION_PRO	Formation professionnelle	t	31
65	SENSIBILISATION_ENV	Sensibilisation environnement	t	37
66	AGRONOMIE	Agronomie	t	37
67	GESTION_RH	Gestion des ressources humaines	t	44
69	SUIVI_PROJET	Suivi de projet	t	25
70	MEDECINE	Médecine	t	22
71	SOINS_INFIRMIERS	Soins infirmiers / aide aux soins	t	22
72	PARAMEDICAL	Paramédical	t	22
73	PSYCHOLOGIE	Psychologie	t	22
74	GESTION_RESEAUX	Gestion de réseaux informatiques	t	43
75	GESTION_LOGICIEL	Gestion logicielle	t	43
23	ENS_PRIMAIRE	Enseignement primaire	t	31
24	DIRECTION_ECOLE	Direction d'école	t	31
25	CONSEIL_PEDAGOGIQUE	Conseil pédagogique	t	31
33	ENS_TECHNIQUE	Enseignement technique	t	31
48	ENS_AGRICOLE	Enseignement agricole	t	31
42	ENS_SECONDAIRE_SCI	Enseignement secondaire (sciences)	t	31
29	ENS_SEC_LANG	Enseignement secondaire (langues)	t	31
43	ENS_UNIV_SCI	Enseignement universitaire (sciences)	t	31
30	ENS_UNIV_LANG	Enseignement universitaire (langues)	t	31
49	ENSEIGNEMENT_ECO	Enseignement (éco/sc. humaines/jur.)	t	31
41	ENSEIGNEMENT_GESTION	Enseignement (gestion de projet)	t	31
28	COORDINATION_CENTRE	Coordination d'un centre	t	22
59	PERSONNES_AGEES	Personnes âgées	t	22
31	ANIMATION_CULTURELLE	Animation culturelle / bibliothèque	t	32
54	ANIMATION_PASTORALE	Animation pastorale	t	32
55	PROMOTION_FEMININE	Promotion féminine	t	32
57	JEUNES	Jeunes	t	32
58	EDUC_SPE	Éducation spécialisée	t	32
56	PERS_HANDICAP	Personnes handicapées	t	32
35	DIRECTION	Direction	t	25
40	ADMIN_SECRETARIAT	Administratif, secrétariat	t	25
52	COMMUNICATION	Communication	t	38
53	TECH_AV	Technicien audio/vidéo	t	38
46	AGRICULTURE	Agriculture	t	37
50	JURIDIQUE	Juridique	t	40
32	CONSTRUCTION	Construction	t	41
34	TECHNICIEN	Technicien	t	41
47	HYDRAULIQUE	Hydraulique	t	37
44	TECHNICIEN_INFO	Technicien informatique	t	43
45	LOGICIEL_SPECIFIQUE	Maîtrise logiciel(s) spécifique(s)	t	43
37	RECHERCHE_FONDS	Recherche de fonds	t	25
62	RESEAUX_SOC	Réseaux sociaux	t	38
\.


--
-- Data for Name: connait_la_dcc_par; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.connait_la_dcc_par (id_candidat, id_notoriete_dcc, autre_designation, detail) FROM stdin;
42	2	\N	\N
43	3	\N	\N
44	7	\N	\N
45	4	\N	\N
46	6	\N	\N
47	3	\N	\N
48	4	\N	\N
49	10	\N	\N
50	6	\N	\N
\.


--
-- Data for Name: contact; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.contact (id_contact, crm_key, role, genre, nom_contact, nom_naissance, prenom_contact, tel_contact, email_contact, date_naissance, lieu_naissance, nationalite, id_adresse) FROM stdin;
58	TEST_IMPORT_01	CAN	F	Rousseau	\N	Camille	0611000001	camille.rousseau@test-import.fr	1992-03-15	Lyon	Française	19
59	TEST_IMPORT_02	CAN	M	Lefevre	\N	Thomas	0611000002	thomas.lefevre@test-import.fr	1985-07-22	Nantes	Française	20
60	TEST_IMPORT_03	CAN	F	Girard	\N	Anne	0611000003	anne.girard@test-import.fr	1988-11-05	Toulouse	Française	21
61	TEST_IMPORT_04	CAN	M	Girardin	\N	Paul	0611000004	paul.girardin@test-import.fr	1991-04-14	Rennes	Française	22
64	TEST_USER_02	CAN	M	Petit	\N	Thomas	0622000002	passerelle_usertest_2@dm-informatique.fr	1987-11-03	Lille	Française	25
65	TEST_USER_03	CAN	F	Durand	\N	Lea	0622000003	passerelle_usertest_3@dm-informatique.fr	1990-02-09	Rennes	Française	26
66	TEST_USER_04	CAN	M	Moreau	\N	Antoine	0622000004	passerelle_usertest_4@dm-informatique.fr	1985-08-17	Toulouse	Française	27
62	TEST_IMPORT_05	CAN	F	Chevaliers	sdfdsf	Sophie	0611000005	sophie.chevalier@test-import.fr	1983-09-30	Strasbourg	Française	23
63	TEST_USER_01	CAN	F	Bernard	\N	Camille	0622000001	passerelle_usertest_1@dm-informatique.fr	1991-04-22	Nantes	Française	24
37	CM_LOIC	CM1	M	Dupont	\N	Loïc	0601020304	loic.dupont@ladcc.org	\N	\N	\N	\N
38	CM_MARIE	CM2	F	Nguyen	\N	Marie	0601020305	marie.nguyen@ladcc.org	\N	\N	\N	\N
39	CHZ_PIERRE	CHZ	M	Martin	\N	Pierre	0601020306	pierre.martin@ladcc.org	\N	\N	\N	\N
40	MIS_SENEGAL	MIS	F	Diop	\N	Aïssatou	00221770000001	contact@mission-senegal.org	\N	\N	\N	3
41	PAR_SENEGAL	PAR	M	Fall	\N	Ousmane	00221770000002	ousmane.fall@ladcc.org	\N	\N	\N	3
42	MIS_BENIN	MIS	M	Kone	\N	Jean	0022997000001	contact@mission-benin.org	\N	\N	\N	4
43	PAR_BENIN	PAR	F	Adjovi	\N	Rose	0022997000002	rose.adjovi@ladcc.org	\N	\N	\N	4
44	PAR_MADAGASCAR	PAR	M	Rakoto	\N	Hery	00261320000001	hery.rakoto@ladcc.org	\N	\N	\N	5
45	ADMIN_TEST	ADMIN	F	Admin	\N	Démo	0600000001	admin.test@ladcc.org	\N	\N	\N	\N
46	REC_TEST	REC	M	Recruteur	\N	Démo	0600000002	recruteur.test@ladcc.org	\N	\N	\N	\N
47	TEST_CAN_DEMO	CAN	F	Démo	\N	Candidat	0600000003	candidat.demo@test.fr	1990-01-01	\N	Française	\N
\.


--
-- Data for Name: criteres_detailles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.criteres_detailles (id_criteres_detailles, date_evaluation, critere, valeur_poste, valeur_candidat, note_obtenue, id_opportunite) FROM stdin;
\.


--
-- Data for Name: domaine; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.domaine (id_domaine, crm_key, designation, active) FROM stdin;
25	GESTION_PROJET	Gestion de projet	t
31	ENSEIGNEMENT	Enseignement	t
38	COMMUNICATION	Communication	t
40	JURIDIQUE	Juridique	t
41	INGENIERIE_TECHNIQUE	Ingénierie - Technique	t
42	COMMERCE	Commerce - Marketing	t
43	INFORMATIQUE	Informatique	t
44	GESTION_ENTREPRISE	Gestion de l'entreprise	t
32	EDUCATION	Education - Animation	t
37	ENVIRONNEMENT	Rural - Environnement	t
33	FINANCES	Finances	f
34	TECHNIQUE	Technique	f
35	INGENIERIE	Ingénierie	f
36	RECH_FONDS	Recherche de fonds	f
39	RH	Ressources humaines	f
22	SANTE	Santé	t
\.


--
-- Data for Name: duree; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.duree (id_duree, crm_key, periode, statut, niveau, active) FROM stdin;
10	1AN	1 an	VSI	2.0	t
11	2AN	2 ans	VSI	3.0	t
12	1A+	1 an renouvelable	VSI	2.5	t
14	18M	18 mois	VSI	2.5	t
13	AUTRE	Autre (voir projet_duree_specifique)	Autre	\N	f
9	11M	jusqu'à 11 mois	Benevolat	1.0	t
\.


--
-- Data for Name: environnement; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.environnement (id_environnement, crm_key, designation, niveau, active) FROM stdin;
10	UPV	Urbain petite ville	2	t
11	RPV	Rural proche de ville	3	t
12	RUI	Rural isolé	4	t
9	UGV	Urbain, grande ville	1	t
\.


--
-- Data for Name: est_conjoint_de; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.est_conjoint_de (id_contact, date_mariage_civil, id_contact_1) FROM stdin;
\.


--
-- Data for Name: est_parent_de; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.est_parent_de (id_contact, id_contact_1, pars_en_volontariat) FROM stdin;
\.


--
-- Data for Name: etape; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.etape (id_historique, acteur, date_evenement, score, note_ecrite, pj_description, url1_piece_jointe, url2_piece_jointe, id_etat_candidat, id_candidat) FROM stdin;
15	Import CRM	2026-08-27	\N	Import initial	\N	\N	\N	AP2	42
16	Import CRM	2026-08-27	\N	Import initial	\N	\N	\N	AP2	43
17	Import CRM	2026-08-27	\N	Import initial	\N	\N	\N	AP2	44
18	Import CRM	2026-08-27	\N	Import initial	\N	\N	\N	AP2	45
19	Import CRM	2026-08-27	\N	Import initial	\N	\N	\N	AP2	46
20	Démo Recruteur	2026-08-28	\N	azertyui	\N	candidats_import_test_v1.csv	cleanup_candidats_seed_test.sql	CHO	46
21	Démo Recruteur	2026-08-31	\N	EFDSF	\N	\N	\N	CHO	44
22	Démo Recruteur	2026-08-31	\N	aezr	\N	\N	\N	CHO	31
23	Démo Recruteur	2026-08-31	\N	azer	\N	\N	\N	ATA	31
24	Import CRM	2026-09-01	\N	Import initial	\N	\N	\N	AP2	47
25	Import CRM	2026-09-01	\N	Import initial	\N	\N	\N	AP2	48
26	Import CRM	2026-09-01	\N	Import initial	\N	\N	\N	AP2	49
27	Import CRM	2026-09-01	\N	Import initial	\N	\N	\N	AP2	50
\.


--
-- Data for Name: etat_candidat; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.etat_candidat (id_etat_candidat, designation, active, delais_de_reponse) FROM stdin;
CRE	Candidat créé	t	7
NEL	Non éligible	t	\N
AP1	1er appel téléphonique	t	14
AP2	2ème appel téléphonique	t	21
CHO	Session choisir	t	14
NCA	Non candidat	t	\N
MEL	Mis en lien	t	5
ACC	Accepté	t	8
ATA	Attente affectation	t	\N
ACP	Accord de principe	t	\N
AFF	Affecté	t	\N
\.


--
-- Data for Name: etat_opportunite; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.etat_opportunite (id_etat_opportunite, designation, active) FROM stdin;
2	Non qualifié	t
3	Rejeté système	t
4	Proposée au CM	t
5	Approuvé CM	t
6	Mise en lien	t
7	Accord de principe	t
8	Accepté	t
9	Affecté	t
10	Rejeté recruteur	t
11	Rejeté CM	t
12	Refus candidat	t
13	Refus partenaire	t
14	Obsolète	t
1	Provisoire	t
\.


--
-- Data for Name: etat_poste; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.etat_poste (id_etat_poste, designation, active) FROM stdin;
2	Pré-affecté	t
3	Pré-réservé	t
4	Réservé	t
5	Pourvu	t
6	Fermé	t
1	À pourvoir	t
\.


--
-- Data for Name: evolue_dans; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.evolue_dans (id_environnement, id_poste) FROM stdin;
9	52
10	53
11	54
12	55
9	56
10	57
11	58
12	59
9	60
10	61
11	62
12	63
9	64
10	65
11	66
12	67
9	68
10	69
11	70
12	71
9	72
10	73
11	74
12	75
9	76
10	77
11	78
12	79
9	80
10	81
11	82
12	83
9	84
10	85
11	86
12	87
9	88
10	89
11	90
9	91
10	92
11	93
12	94
9	95
10	96
11	97
9	98
10	99
12	100
11	101
\.


--
-- Data for Name: fiche_de_poste; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.fiche_de_poste (id_poste, crm_key, flag_create_opportunity, flag_poste_deja_mis_en_lien, statut_volontaire, ong, candidat_preaffecte, nom_candidat, fonction, date_demande, priorite, indemnite_mensuelle_partenaire, indemnite_mensuelle_dcc, gite_et_couvert, hebergement_detail, date_arrivee_souhaitee, preference_genre, deuxieme_poste_possible_partenaire, deuxieme_poste_possible_alentour, nouveau_poste, nom_ancien_volontaire, odd_lie, contexte_mission, objectifs_mission, taches, competences_detail, dimension_ecclesial, flag_zone_orange, flag_condition_spartiates, flag_hopital_proche, id_etat_poste, id_pays, id_hebergement, id_duree, id_domaine, id_type_billet_avion, date_maj_crm, date_dernier_recalcul_score) FROM stdin;
63	POSTE-012	t	f	VSI	DCC	f	\N	Infirmier de brousse	2026-10-25	BAS	90	140	Inclus	Vie en communaute religieuse	2027-11-15	\N	t	f	f	\N	ODD 3	Centre de sante isole necessitant un renfort de formation	Former le personnel local aux bonnes pratiques	Formations continues - protocoles de soins	Diplome infirmier - pedagogie	Centre gere par des religieuses	f	t	f	1	48	9	12	22	\N	\N	\N
53	POSTE-002	t	f	VSI	DCC	f	\N	Infirmier de brousse	2026-09-05	MOY	90	140	Partiel	Colocation avec 2 autres volontaires	2027-04-01	\N	f	f	f	\N	ODD 3	Dispensaire rural manquant de personnel soignant	Ameliorer le suivi sanitaire de la population locale	Soins courants - vaccination - sensibilisation hygiene	Diplome infirmier - autonomie	Dispensaire tenu par une congregation locale	f	f	f	1	38	8	10	22	1	\N	\N
56	POSTE-005	t	f	Benevolat	DCC	f	\N	Coordinateur de projet	2026-09-20	MOY	85	125	Inclus	Colocation en centre-ville	2027-07-05	\N	f	f	t	\N	ODD 17	Coordination d'un reseau de petites associations locales	Structurer et professionnaliser le suivi de projets	Reporting - formation des equipes locales - recherche de financements	Gestion de projet - diplomatie	Reseau d'associations d'inspiration chretienne	t	f	t	1	41	8	9	25	1	\N	\N
66	POSTE-015	t	f	VSI	DCC	f	\N	Coordinateur de projet	2026-11-10	BAS	75	125	Inclus	Vie en communaute religieuse	2028-01-01	\N	t	f	f	\N	ODD 1	Reseau d'oeuvres sociales cherchant a diversifier ses financements	Structurer la recherche de fonds internationaux	Redaction de dossiers - suivi bailleurs	Anglais courant - rigueur administrative	Reseau d'oeuvres catholiques	f	f	f	1	51	9	11	25	1	\N	\N
73	POSTE-022	t	f	Benevolat	DCC	f	\N	Infirmier de brousse	2026-12-15	HAU	60	110	Inclus	Logement seul dans l'enceinte du centre	2028-04-15	\N	f	f	f	\N	ODD 3	Centre de sante en reorganisation	Appuyer la coordination generale du centre	Organisation des soins - gestion des stocks	Diplome infirmier - sens de l'organisation	Centre catholique	f	f	f	1	40	7	9	22	\N	\N	\N
83	POSTE-032	t	f	Benevolat	DCC	f	\N	Infirmier de brousse	2027-02-05	MOY	65	115	Partiel	Colocation dans l'enceinte du centre	2028-09-15	\N	f	f	f	\N	ODD 3	Dispensaire isole manquant de personnel	Assurer les soins courants de la population locale	Soins - vaccination - suivi maternel	Diplome infirmier	Dispensaire diocesain	f	t	f	1	50	8	9	22	\N	\N	\N
76	POSTE-025	t	f	VSI	DCC	f	\N	Coordinateur de projet	2027-01-01	HAU	65	115	Inclus	Logement seul en ville	2028-06-01	\N	f	f	t	\N	ODD 8	ONG locale en structuration administrative	Mettre en place une comptabilite fiable	Suivi comptable - formation de l'equipe locale	Comptabilite - rigueur	ONG d'inspiration chretienne	f	f	f	1	43	7	12	25	1	\N	\N
86	POSTE-035	t	f	VSI	DCC	f	\N	Coordinateur de projet	2027-02-20	MOY	70	120	Partiel	Colocation en centre-ville	2028-11-01	\N	f	f	f	\N	ODD 1	Reseau d'oeuvres sociales cherchant un directeur adjoint	Co-piloter l'ensemble des activites du reseau	Management d'equipe - reporting	Gestion de projet - espagnol courant	Reseau d'oeuvres catholiques	f	f	f	1	53	8	11	25	1	\N	\N
93	POSTE-042	t	f	VSI	DCC	f	\N	Infirmier de brousse	2027-03-25	BAS	80	130	Inclus	Vie en communaute religieuse	2029-02-15	\N	f	f	f	\N	ODD 3	Centre de sante paroissial isole	Assurer la continuite des soins courants	Soins - suivi maternel - sensibilisation	Diplome infirmier	Centre paroissial	f	t	f	1	42	9	10	22	1	\N	\N
96	POSTE-045	t	f	VSI	DCC	f	\N	Coordinateur de projet	2027-04-10	BAS	60	110	Inclus	Vie en communaute religieuse	2029-04-01	\N	f	f	f	\N	ODD 8	Bureau local d'une oeuvre caritative	Appuyer l'administration generale du bureau	Suivi administratif - organisation	Rigueur administrative	Bureau diocesain	f	f	f	1	45	9	10	25	\N	\N	\N
52	POSTE-001	t	f	Benevolat	DCC	f	\N	Enseignant primaire	2026-09-01	HAU	80	120	Inclus	Chambre individuelle chez l'habitant	2027-03-15	\N	f	f	f	\N	ODD 4	Ecole primaire en periode de croissance des effectifs	Renforcer le soutien scolaire aupres des eleves en difficulte	Cours de soutien - suivi individualise - lien avec les familles	Pedagogie adaptee - patience - sens du contact	Vie communautaire avec les Soeurs de la Mission	f	f	t	1	37	7	9	31	\N	\N	\N
94	POSTE-043	t	f	VSI	DCC	f	\N	Professeur de francais	2027-04-01	HAU	70	120	Inclus	Logement seul sur le campus	2029-03-01	\N	f	f	f	\N	ODD 4	Institut universitaire catholique isole	Assurer des cours de francais avance	Cours magistraux - encadrement memoires	Master lettres	Institut catholique	f	f	f	1	43	7	11	31	\N	\N	\N
99	POSTE-048	f	f	VSI	Freres des Ecoles Chretiennes	t	Antoine Lavoisier	Professeur de francais	2026-09-25	HAU	70	120	Inclus	Vie en communaute avec les freres	2027-06-01	\N	f	f	f	\N	ODD 4	College tenu par les Freres des Ecoles Chretiennes	Reprendre les classes laissees par le volontaire precedent	Cours de francais - suivi des examens	Licence lettres	Congregation des Freres des Ecoles Chretiennes	f	f	f	5	48	9	12	31	\N	\N	\N
55	POSTE-004	t	f	VSI	DCC	f	\N	Responsable technique	2026-09-15	HAU	100	150	Non inclus	Logement independant a proximite du chantier	2027-06-20	H	f	f	f	\N	ODD 9	Reconstruction d'un centre de formation professionnelle	Superviser les travaux de reconstruction	Suivi de chantier - gestion des ouvriers - reporting	BTS batiment - gestion d'equipe	Centre gere par un diocese local	f	t	f	1	40	7	12	34	\N	\N	\N
97	POSTE-046	f	f	VSI	Petites soeurs d'Afrique	t	Paul Langevin	Infirmier de brousse	2026-09-15	HAU	90	140	Inclus	Logement seul au sein du dispensaire	2027-05-01	\N	f	f	f	\N	ODD 3	Dispensaire tenu par les Petites Soeurs d'Afrique	Poursuivre la mission du volontaire precedent	Soins courants - suivi des patients chroniques	Diplome infirmier	Congregation des Petites Soeurs d'Afrique	f	f	t	5	46	7	10	22	1	\N	\N
98	POSTE-047	f	f	VSI	Fondation Saint-Vincent	t	Marie Curie	Coordinateur de projet	2026-09-20	HAU	85	135	Partiel	Colocation proche du siege de la fondation	2027-05-15	\N	f	f	f	\N	ODD 1	Fondation Saint-Vincent - siege local	Reprendre la coordination du programme en cours	Suivi budgetaire - management d'equipe locale	Gestion de projet	Fondation Saint-Vincent	f	f	f	5	47	8	11	25	1	\N	\N
54	POSTE-003	t	f	VSI	DCC	f	\N	Professeur de francais	2026-09-10	BAS	70	130	Inclus	Vie en communaute religieuse	2027-05-10	\N	f	f	t	\N	ODD 4	College partenaire cherchant a renforcer son equipe pedagogique	Assurer les cours de francais niveau college	Preparation de cours - correction - suivi eleves	Licence lettres - gout pour l'enseignement	Communaute religieuse locale accueillante	f	f	f	1	39	9	11	31	1	\N	\N
62	POSTE-011	t	f	VSI	DCC	f	\N	Enseignant primaire	2026-10-20	MOY	70	120	Inclus	Colocation avec 1 autre volontaire	2027-11-01	\N	f	f	f	\N	ODD 4	Petite ecole paroissiale en developpement	Appuyer la direction pedagogique de l'ecole	Coordination enseignants - suivi des programmes	Experience en direction d'ecole appreciee	Paroisse locale	f	f	f	1	47	8	11	31	1	\N	\N
64	POSTE-013	t	f	VSI	DCC	f	\N	Professeur de francais	2026-11-01	HAU	95	145	Non inclus	Appartement independant en centre-ville	2027-12-01	\N	f	f	t	\N	ODD 4	Universite catholique cherchant a renforcer son departement de francais	Assurer des cours de francais universitaire	Cours magistraux - travaux diriges	Master lettres - experience enseignement superieur	Universite catholique locale	f	f	t	1	49	7	10	31	1	\N	\N
57	POSTE-006	t	f	VSI	DCC	f	\N	Technicien informatique	2026-09-25	BAS	75	120	Partiel	Vie en communaute	2027-08-12	\N	f	f	f	\N	ODD 4	Ecole technique disposant d'un parc informatique vieillissant	Maintenir et former les eleves aux outils informatiques	Maintenance parc informatique - formation bureautique	Bases reseau - pedagogie	Ecole geree par une congregation	f	f	f	1	42	9	10	34	\N	\N	\N
65	POSTE-014	t	f	Benevolat	DCC	f	\N	Responsable technique	2026-11-05	MOY	60	110	Partiel	Colocation proche du centre de formation	2027-12-15	H	f	f	f	\N	ODD 9	Centre de formation professionnelle en zone urbaine	Former les jeunes aux metiers techniques	Cours pratiques - suivi des stagiaires	Bac pro technique - pedagogie	Centre catholique de formation	f	f	f	1	50	8	9	34	\N	\N	\N
67	POSTE-016	t	f	VSI	DCC	f	\N	Technicien informatique	2026-11-15	HAU	65	115	Inclus	Logement seul	2028-01-15	\N	f	f	t	\N	ODD 4	Ecole rurale ayant recu un don d'ordinateurs	Deployer et former a l'usage des nouveaux outils	Installation logicielle - formation enseignants	Espagnol courant - pedagogie	Ecole diocesaine	f	f	f	1	52	7	12	34	\N	\N	\N
75	POSTE-024	t	f	VSI	DCC	f	\N	Responsable technique	2026-12-25	BAS	95	145	Inclus	Vie en communaute religieuse	2028-05-15	H	f	f	f	\N	ODD 9	Atelier de maintenance pour un reseau d'ecoles	Assurer la maintenance des infrastructures	Maintenance batiments - petite electricite	Bricolage - autonomie	Reseau d'ecoles diocesaines	f	t	f	1	42	9	11	34	\N	\N	\N
77	POSTE-026	t	f	Benevolat	DCC	f	\N	Technicien informatique	2027-01-05	MOY	80	130	Partiel	Colocation proche du campus	2028-06-15	\N	f	f	f	\N	ODD 4	Lycee technique cherchant un renfort informatique	Enseigner les bases de la programmation	Cours d'initiation - suivi de projets eleves	Notions de programmation - pedagogie	Lycee catholique	t	f	t	1	44	8	9	34	\N	\N	\N
85	POSTE-034	t	f	VSI	DCC	f	\N	Responsable technique	2027-02-15	HAU	95	145	Non inclus	Logement seul en ville	2028-10-15	H	f	f	t	\N	ODD 9	Construction d'un nouveau centre communautaire	Superviser la fin des travaux de construction	Suivi de chantier - relations fournisseurs	BTS batiment - espagnol	Projet paroissial	f	f	f	1	52	7	10	34	\N	\N	\N
87	POSTE-036	t	f	Benevolat	DCC	f	\N	Technicien informatique	2027-02-25	BAS	55	105	Inclus	Vie en communaute religieuse	2028-11-15	\N	f	f	f	\N	ODD 4	Petit college disposant d'une salle informatique neuve	Mettre en route la salle informatique	Installation - formation des enseignants	Bases reseau - pedagogie	College catholique	t	t	f	1	54	9	9	34	\N	\N	\N
59	POSTE-008	t	f	VSI	DCC	f	\N	Charge de plaidoyer	2026-10-05	MOY	110	160	Non inclus	Appartement partage proche du centre	2027-09-18	\N	f	f	f	\N	ODD 16	Association de defense des droits des refugies	Renforcer le plaidoyer local aupres des autorites	Redaction de notes - rencontres institutionnelles	Droit - anglais courant	Association chretienne locale	t	f	t	1	44	8	12	40	\N	\N	\N
69	POSTE-018	t	f	Benevolat	DCC	f	\N	Charge de plaidoyer	2026-11-25	BAS	55	105	Inclus	Vie en communaute religieuse	2028-02-15	\N	f	f	t	\N	ODD 16	Association locale de sensibilisation citoyenne	Appuyer les sessions de formation citoyenne	Animation de sessions - support pedagogique	Sciences politiques ou droit	Association d'inspiration chretienne	t	t	f	1	54	9	9	40	\N	\N	\N
79	POSTE-028	t	f	VSI	DCC	f	\N	Charge de plaidoyer	2027-01-15	HAU	85	135	Non inclus	Studio independant	2028-07-15	\N	f	f	f	\N	ODD 16	Structure d'accompagnement juridique des migrants	Renforcer l'accompagnement juridique des beneficiaires	Consultations juridiques - suivi de dossiers	Droit - discretion	Structure diocesaine	t	f	f	1	46	7	11	40	\N	\N	\N
89	POSTE-038	t	f	VSI	DCC	f	\N	Charge de plaidoyer	2027-03-05	MOY	85	135	Partiel	Colocation proche du bureau	2028-12-15	\N	f	f	f	\N	ODD 16	Association locale de defense des droits de l'enfant	Appuyer les actions de sensibilisation juridique	Redaction - animation de sessions	Droit ou sciences sociales	Association chretienne	f	f	f	1	38	8	10	40	\N	\N	\N
61	POSTE-010	t	f	VSI	DCC	f	\N	Animateur socio-educatif	2026-10-15	HAU	80	130	Partiel	Studio independant	2027-10-15	\N	f	f	f	\N	ODD 10	Centre d'accueil pour jeunes en difficulte	Animer des activites educatives et pastorales	Animation d'ateliers - accompagnement individuel	Experience jeunesse - ecoute	Centre paroissial	f	f	f	1	46	7	10	32	\N	\N	\N
71	POSTE-020	t	f	VSI	DCC	f	\N	Animateur socio-educatif	2026-12-05	MOY	85	135	Partiel	Colocation avec 2 volontaires	2028-03-15	\N	f	f	f	\N	ODD 10	Centre d'accueil pour enfants en situation de handicap	Accompagner les enfants dans les activites du quotidien	Animation - soutien educatif - suivi individuel	Sensibilite au handicap - patience	Centre gere par une congregation	f	f	f	1	38	8	11	32	\N	\N	\N
81	POSTE-030	t	f	VSI	DCC	f	\N	Animateur socio-educatif	2027-01-25	BAS	90	140	Inclus	Vie en communaute religieuse	2028-08-15	F	f	f	f	\N	ODD 10	Institut specialise pour enfants en difficulte	Accompagner l'equipe educative au quotidien	Ateliers - suivi individuel - lien familles	Experience education specialisee	Institut catholique	f	f	f	1	48	9	10	32	\N	\N	\N
91	POSTE-040	t	f	VSI	DCC	f	\N	Animateur socio-educatif	2027-03-15	HAU	65	115	Inclus	Logement seul proche de la structure	2029-01-15	\N	f	f	f	\N	ODD 3	Maison d'accueil pour personnes agees isolees	Animer des activites pour les residents	Ateliers - accompagnement - ecoute	Sens du contact - patience	Maison geree par des religieuses	f	f	f	1	40	7	12	32	\N	\N	\N
72	POSTE-021	t	f	VSI	DCC	f	\N	Enseignant primaire	2026-12-10	BAS	90	140	Inclus	Vie en communaute religieuse	2028-04-01	\N	f	f	f	\N	ODD 4	Reseau d'ecoles primaires diocesaines	Accompagner les enseignants locaux sur le plan pedagogique	Formation continue - visites de classe	Experience enseignement - pedagogie active	Reseau diocesain	f	f	t	1	39	9	12	31	1	\N	\N
74	POSTE-023	t	f	VSI	DCC	f	\N	Professeur de francais	2026-12-20	MOY	75	125	Partiel	Colocation proche de l'ecole	2028-05-01	\N	f	f	t	\N	ODD 4	Bibliotheque paroissiale a redynamiser	Animer des activites autour de la lecture	Animation bibliotheque - ateliers lecture	Gout pour la mediation culturelle	Paroisse locale	t	f	t	1	41	8	10	31	1	\N	\N
82	POSTE-031	t	f	VSI	DCC	f	\N	Enseignant primaire	2027-02-01	HAU	75	125	Inclus	Logement seul proche de l'ecole	2028-09-01	\N	f	f	f	\N	ODD 4	Ecole paroissiale en zone semi-rurale	Renforcer le soutien scolaire des eleves	Cours de soutien - suivi personnalise	Pedagogie - patience	Paroisse locale	f	f	f	1	49	7	11	31	1	\N	\N
84	POSTE-033	t	f	VSI	DCC	f	\N	Professeur de francais	2027-02-10	BAS	80	130	Inclus	Vie en communaute religieuse	2028-10-01	\N	f	f	f	\N	ODD 4	Lycee catholique renomme cherchant un renfort	Enseigner le francais niveau lycee	Cours - preparation aux examens	Licence lettres	Lycee catholique local	f	f	t	1	51	9	12	31	1	\N	\N
92	POSTE-041	t	f	Benevolat	DCC	f	\N	Enseignant primaire	2027-03-20	MOY	75	125	Partiel	Colocation avec 2 volontaires	2029-02-01	\N	f	f	f	\N	ODD 4	Ecole primaire diocesaine en zone urbaine	Renforcer l'equipe enseignante	Cours - preparation pedagogique	Experience enseignement primaire	Ecole diocesaine	f	f	f	1	41	8	9	31	1	\N	\N
95	POSTE-044	t	f	VSI	DCC	f	\N	Responsable technique	2027-04-05	MOY	95	145	Non inclus	Colocation proche du centre de formation	2029-03-15	H	f	f	f	\N	ODD 9	Centre de formation technique pour jeunes refugies	Encadrer les ateliers pratiques	Cours pratiques - securite atelier	Formation technique	Centre diocesain	t	f	t	1	44	8	12	34	1	\N	\N
58	POSTE-007	t	f	VSI	DCC	f	\N	Agronome	2026-10-01	HAU	60	110	Inclus	Logement seul au sein de l'exploitation	2027-09-01	\N	f	f	f	\N	ODD 2	Ferme-ecole en zone rurale isolee	Accompagner la diversification des cultures vivrieres	Formation des agriculteurs - suivi des parcelles pilotes	Formation agricole - terrain	Projet porte par une paroisse locale	f	f	f	1	43	7	11	37	1	\N	\N
68	POSTE-017	t	f	VSI	DCC	f	\N	Agronome	2026-11-20	MOY	80	130	Partiel	Colocation en ville proche de la mission	2028-02-01	\N	f	t	f	\N	ODD 6	Communaute rurale confrontee a des difficultes d'acces a l'eau	Ameliorer l'acces a l'eau potable	Etude de faisabilite - suivi de travaux	Genie rural - espagnol	Mission tenue par des religieux	f	f	f	1	53	8	10	37	1	\N	\N
78	POSTE-027	t	f	VSI	DCC	f	\N	Agronome	2027-01-10	BAS	70	120	Inclus	Vie en communaute religieuse	2028-07-01	\N	f	f	f	\N	ODD 2	Centre de formation agricole pour jeunes refugies	Former les jeunes aux techniques agricoles de base	Cours pratiques - suivi de parcelles pedagogiques	Formation agricole	Centre tenu par une congregation	f	f	f	1	45	9	10	37	1	\N	\N
88	POSTE-037	t	f	VSI	DCC	f	\N	Agronome	2027-03-01	HAU	60	110	Inclus	Logement seul chez l'habitant	2028-12-01	\N	f	f	f	\N	ODD 2	Exploitation maraichere en developpement	Ameliorer les rendements de l'exploitation	Suivi des cultures - formation des ouvriers	Formation agricole	Exploitation geree par un partenaire local	f	f	f	1	37	7	12	37	1	\N	\N
101	POSTE-050	f	f	VSI	Petites soeurs d'Afrique	t	Louis Pasteur	Agronome	2026-10-05	HAU	75	125	Partiel	Colocation proche de l'exploitation	2027-07-01	\N	f	f	f	\N	ODD 2	Exploitation agricole geree par les Petites Soeurs d'Afrique	Poursuivre le programme de diversification agricole	Suivi des cultures - formation continue	Formation agricole	Congregation des Petites Soeurs d'Afrique	f	f	f	5	37	8	11	37	1	\N	\N
60	POSTE-009	t	f	Benevolat	DCC	f	\N	Charge de communication	2026-10-10	BAS	65	115	Inclus	Vie en communaute religieuse	2027-10-02	F	f	f	t	\N	ODD 17	Structure d'accueil de pelerins necessitant une refonte de communication	Redynamiser la communication digitale de la structure	Reseaux sociaux - newsletter - photos/videos	Aisance redactionnelle - reseaux sociaux	Structure tenue par une congregation	t	f	t	1	45	9	9	38	1	\N	\N
70	POSTE-019	t	f	VSI	DCC	f	\N	Charge de communication	2026-12-01	HAU	70	120	Inclus	Logement seul chez l'habitant	2028-03-01	\N	f	f	f	\N	ODD 17	Radio communautaire portee par un diocese	Produire des reportages audio pour la radio locale	Prise de son - montage - reportage terrain	Notions audiovisuelles	Diocese local	f	f	f	1	37	7	10	38	1	\N	\N
80	POSTE-029	t	f	VSI	DCC	f	\N	Charge de communication	2027-01-20	MOY	60	110	Partiel	Colocation avec 1 autre volontaire	2028-08-01	\N	f	f	t	\N	ODD 17	Diocese cherchant a moderniser sa communication	Former une equipe locale a la communication digitale	Formation - creation de supports	Pedagogie - reseaux sociaux	Diocese local	f	f	t	1	47	8	12	38	1	\N	\N
90	POSTE-039	t	f	VSI	DCC	f	\N	Charge de communication	2027-03-10	BAS	90	140	Inclus	Vie en communaute religieuse	2029-01-01	\N	f	f	t	\N	ODD 17	Radio diocesaine en pleine expansion	Structurer la communication externe de la radio	Community management - relations presse	Aisance redactionnelle	Radio diocesaine	f	f	t	1	39	9	11	38	1	\N	\N
100	POSTE-049	f	f	VSI	Filles de la Charite	t	Camille Claudel	Animateur socio-educatif	2026-10-01	HAU	80	130	Inclus	Logement seul dans l'enceinte du centre	2027-06-15	\N	f	f	f	\N	ODD 10	Centre d'accueil tenu par les Filles de la Charite	Assurer la continuite de l'accompagnement des residents	Animation - accompagnement individuel	Sensibilite au handicap	Congregation des Filles de la Charite	f	f	t	5	49	7	10	32	1	\N	\N
\.


--
-- Data for Name: fiche_de_voeux; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.fiche_de_voeux (id_fiche_de_voeux, flag_create_opportunity, flag_fiche_de_voeux_soumise, flag_update_score, flag_candidat_deja_mis_en_lien, date_creation, date_modification, modifie_par, part_seul, zone_orange, conditions_spartiates, hopital_proche, fonctionnaire_dispo_demandee, date_depart_souhaite, nouveau_poste, nouvelle_langue, competences_a_developper, centres_interret, categorie_ecclesiale, categorie_ecclesiale_detail, acces_candidat, date_voeux_provisoires, date_voeux_definitifs, id_candidat, date_depart_possible, verrouille, verrouille_par, date_verrouillage) FROM stdin;
17	f	f	f	f	2026-08-27	\N	\N	t	\N	\N	\N	\N	2026-09-01	\N	\N	\N	\N	\N	\N	t	\N	\N	42	\N	f	\N	\N
18	f	f	f	f	2026-08-27	\N	\N	f	\N	\N	\N	\N	2027-03-01	\N	\N	\N	\N	\N	\N	t	\N	\N	43	\N	f	\N	\N
20	f	f	f	f	2026-08-27	\N	\N	t	\N	\N	\N	\N	2027-01-01	\N	\N	\N	\N	\N	\N	t	\N	\N	45	\N	f	\N	\N
19	f	f	f	f	2026-08-27	2026-08-27	Démo Recruteur	t	f	\N	\N	\N	2026-06-03	\N	\N					t	\N	\N	44	\N	f	\N	\N
24	f	f	f	f	2026-09-01	\N	\N	f	\N	\N	\N	\N	2027-03-01	\N	\N	\N	\N	\N	\N	t	\N	\N	48	\N	f	\N	\N
25	f	f	f	f	2026-09-01	\N	\N	t	\N	\N	\N	\N	2026-06-01	\N	\N	\N	\N	\N	\N	t	\N	\N	49	\N	f	\N	\N
26	f	f	f	f	2026-09-01	\N	\N	f	\N	\N	\N	\N	2026-09-01	\N	\N	\N	\N	\N	\N	t	\N	\N	50	\N	f	\N	\N
22	f	f	f	f	2026-08-27	2026-09-01	Démo Recruteur	f	f	t	f	f	2026-09-06	f	t					t	2026-08-31	2026-08-31	31	\N	t	Candidat Démo	2026-08-31
23	f	f	f	f	2026-09-01	2026-09-01	Démo Recruteur	t	t	f	f	t	2026-10-01	f	f	fdsgfsdghs				t	\N	\N	47	\N	f	\N	\N
21	f	f	f	f	2026-08-27	2026-09-02	Démo Recruteur	t	f	\N	\N	\N	2026-09-01	\N	t			true		t	\N	\N	46	\N	f	\N	\N
\.


--
-- Data for Name: gere_poste; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.gere_poste (id_contact, id_poste) FROM stdin;
37	52
39	52
40	52
41	52
37	53
38	53
39	53
42	53
43	53
37	54
39	54
37	55
39	55
37	56
38	56
39	56
37	57
39	57
37	58
39	58
44	58
37	59
38	59
39	59
37	60
39	60
37	61
39	61
37	62
39	62
37	63
38	63
39	63
37	64
39	64
37	65
39	65
37	66
38	66
39	66
37	67
39	67
37	68
39	68
37	69
39	69
37	70
38	70
39	70
40	70
41	70
37	71
39	71
42	71
43	71
37	72
39	72
37	73
39	73
37	74
38	74
39	74
37	75
39	75
37	76
39	76
44	76
37	77
39	77
37	78
38	78
39	78
37	79
39	79
37	80
39	80
37	81
38	81
39	81
37	82
39	82
37	83
39	83
37	84
38	84
39	84
37	85
39	85
37	86
38	86
39	86
37	87
39	87
37	88
39	88
40	88
41	88
37	89
39	89
42	89
43	89
37	90
38	90
39	90
37	91
39	91
37	92
39	92
37	93
39	93
37	94
38	94
39	94
44	94
37	95
39	95
37	96
38	96
39	96
37	97
39	97
37	98
38	98
39	98
37	99
39	99
37	100
38	100
39	100
37	101
39	101
40	101
41	101
\.


--
-- Data for Name: hebergement; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.hebergement (id_hebergement, crm_key, designation, active) FROM stdin;
8	COL	Colocation	t
9	VCR	Vie avec communauté religieuse	t
7	LOS	Logement seul	t
\.


--
-- Data for Name: historique_poste; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.historique_poste (id_historique, id_poste, id_contact, action, commentaire, pieces_jointes, date_evenement) FROM stdin;
\.


--
-- Data for Name: inscrit_a; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.inscrit_a (id_fiche_de_voeux, id_stages) FROM stdin;
\.


--
-- Data for Name: langue; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.langue (id_langue, crm_key, designation, active) FROM stdin;
10	ANG	Anglais	t
11	ESP	Espagnol	t
12	POR	Portugais	t
13	ZOU	Zoulou	f
14	ITA	Italien	t
15	ALL	Allemand	t
16	ARA	Arabe	t
9	FR	Français	t
\.


--
-- Data for Name: langue_poste; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.langue_poste (id_poste, id_langue, id_niveau_langue) FROM stdin;
95	10	10
83	10	10
77	10	10
68	11	10
65	10	10
60	10	10
57	10	10
53	10	10
101	9	11
100	9	11
98	9	11
97	9	11
96	10	11
93	9	11
92	9	11
91	9	11
90	9	11
88	9	11
87	9	11
86	11	11
85	11	11
82	9	11
81	9	11
79	9	11
78	10	11
76	9	11
74	9	11
73	9	11
72	9	11
70	9	11
69	9	11
67	11	11
66	10	11
63	9	11
61	9	11
59	10	11
58	9	11
56	9	11
52	9	11
89	9	9
80	9	9
75	9	9
71	9	9
62	9	9
55	9	9
54	9	12
64	9	12
84	9	12
94	9	12
99	9	12
\.


--
-- Data for Name: niveau_langue; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.niveau_langue (id_niveau_langue, designation, ordre, crm_key, active) FROM stdin;
10	Parlé	2	PARLE	t
11	Courant	3	COURANT	t
12	Natif	4	NATIF	t
9	Notions	1	NOTIONS	t
\.


--
-- Data for Name: notoriete_dcc; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notoriete_dcc (id_notoriete_dcc, designation, active, crm_key) FROM stdin;
3	Internet	t	INTERNET
4	Réseaux sociaux	t	RESEAUX_SOCIAUX
5	Offre de volontariat (annonces publiées en ligne)	t	OFFRE_VOLONTARIAT
6	Média (presse, radio, TV)	t	MEDIA
9	Autre	t	AUTRE
7	Sur un stand DCC (événement en Eglise)	t	STAND_DCC_EGLISE
10	Sur un stand DCC (événement hors Eglise)	t	STAND_DCC_HORS_EGLISE
11	Témoignage - milieu scolaire ou université	t	TEMOIGNAGE_SCOLAIRE
12	Témoignage - paroisse ou mouvement d'Eglise	t	TEMOIGNAGE_PAROISSE
13	Témoignage - grand rassemblement	t	TEMOIGNAGE_RASSEMBLEMENT
14	Témoignage - autre	t	TEMOIGNAGE_AUTRE
2	Bouche à oreille	t	BOUCHE_A_OREILLE
1	Mission pré-affectée	t	MISSION_PREAFFECTEE
\.


--
-- Data for Name: opportunite; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.opportunite (id_opportunite, flag_opportunite_proposee_a_cm, flag_opportunite_retenue, flag_opportunite_non_retenu, note_contexte, note_mission, note_warning, appreciation_recruteur, commentaire_charge_mission, id_etat_opportunite, id_poste, id_fiche_de_voeux, flag_opportunite_obsolete) FROM stdin;
\.


--
-- Data for Name: parle; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.parle (id_fiche_de_voeux, id_langue, autre_langue, id_niveau_langue) FROM stdin;
19	11	\N	10
25	10	\N	11
24	11	\N	11
17	10	\N	11
26	9	\N	12
25	9	\N	12
24	9	\N	12
19	9	\N	12
20	9	\N	12
18	9	\N	12
17	9	\N	12
26	16	\N	9
20	15	\N	9
22	16	\N	9
23	10	\N	10
23	9	\N	12
21	10	\N	11
21	16	\N	9
21	9	\N	12
\.


--
-- Data for Name: pays; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.pays (id_pays, crm_key, designation, active, id_region) FROM stdin;
38	BENIN	Bénin	t	13
39	CAMEROUN	Cameroun	t	13
40	COTE_IVOIRE	Côte d'Ivoire	t	13
41	RDCONGO	République Démocratique du Congo	t	13
42	TOGO	Togo	t	13
43	MADAGASCAR	Madagascar	t	14
44	LIBAN	Liban	t	15
45	JORDANIE	Jordanie	t	15
46	MAROC	Maroc	t	16
47	TUNISIE	Tunisie	t	16
48	ALGERIE	Algérie	t	16
49	VIETNAM	Vietnam	t	17
50	CAMBODGE	Cambodge	t	17
51	PHILIPPINES	Philippines	t	17
52	PEROU	Pérou	t	18
53	BOLIVIE	Bolivie	t	18
55	GUATEMALA	Guatemala	t	18
56	MEXIQUE	Mexique	t	18
57	EQUATEUR	Equateur	t	18
58	ARGENTINE	Argentine	t	18
59	CHILI	Chili	t	18
60	BRESIL	Brésil	t	18
61	COLOMBIE	Colombie	t	18
62	INDE	Inde	t	17
63	VANUATU	Vanuatu	t	17
64	THAILANDE	Thaïlande	t	17
65	JERUSALEM	Jérusalem	t	15
66	PALESTINE	Palestine	t	15
67	GUINEE_CONAKRY	Guinée Conakry	t	13
68	CONGO	Congo	t	13
69	RWANDA	Rwanda	t	13
70	BURUNDI	Burundi	t	13
71	TANZANIE	Tanzanie	t	13
72	TCHAD	Tchad	t	13
73	OUGANDA	Ouganda	t	13
74	GHANA	Ghana	t	13
75	GABON	Gabon	t	13
76	DJIBOUTI	Djibouti	t	13
77	MAURITANIE	Mauritanie	t	13
78	EGYPTE	Egypte	t	16
54	HAITI	Haïti	f	18
37	SENEGAL	Sénégal	t	13
\.


--
-- Data for Name: recherche; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.recherche (id_competences, id_poste) FROM stdin;
22	52
23	52
26	53
29	54
32	55
36	56
44	57
46	58
50	59
52	60
54	61
57	61
24	62
27	63
30	64
33	65
37	66
45	67
47	68
49	69
53	70
56	71
25	72
28	73
31	74
34	75
39	76
42	77
48	78
50	79
51	80
58	81
22	82
26	83
29	84
32	85
35	86
44	87
46	88
50	89
52	90
59	91
23	92
26	93
30	94
33	95
40	96
26	97
36	98
29	99
56	100
46	101
\.


--
-- Data for Name: region; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.region (id_region, crm_key, designation, active) FROM stdin;
14	MAD	Madagascar	t
15	PRO	Proche-Orient	t
16	MAG	Maghreb	t
17	ASP	Asie / Pacifique	t
18	AML	Amérique latine	t
13	AFS	Afrique subsaharienne	t
\.


--
-- Data for Name: stages; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.stages (id_stages, type_stage, date_debut, date_fin, active, voeux_definitif_ouvert) FROM stdin;
\.


--
-- Data for Name: type_billet_avion; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.type_billet_avion (id_type_billet_avion, crm_key, designation, active) FROM stdin;
2	DCC	DCC	t
3	VOLONTAIRE	Volontaire	t
1	PARTENAIRE	Partenaire	t
\.


--
-- Data for Name: user_; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_ (id_user, login, password, id_contact, active, password_reset_requested_at, password_reset_nonce_hash) FROM stdin;
13	loic.dupont	$2b$12$mxXfdDJ7PRfhjmvX4XrI1uqHM8vagdBHAjSxmyC5ghQglf.llMub.	37	t	\N	\N
14	marie.nguyen	$2b$12$mxXfdDJ7PRfhjmvX4XrI1uqHM8vagdBHAjSxmyC5ghQglf.llMub.	38	t	\N	\N
16	admin.test	$2b$12$mxXfdDJ7PRfhjmvX4XrI1uqHM8vagdBHAjSxmyC5ghQglf.llMub.	45	t	\N	\N
17	recruteur.test	$2b$12$mxXfdDJ7PRfhjmvX4XrI1uqHM8vagdBHAjSxmyC5ghQglf.llMub.	46	t	\N	\N
18	candidat.demo@test.fr	$2b$12$mxXfdDJ7PRfhjmvX4XrI1uqHM8vagdBHAjSxmyC5ghQglf.llMub.	47	t	\N	\N
27	camille.rousseau@test-import.fr	$2b$12$mxXfdDJ7PRfhjmvX4XrI1uqHM8vagdBHAjSxmyC5ghQglf.llMub.	58	t	\N	\N
28	thomas.lefevre@test-import.fr	$2b$12$mxXfdDJ7PRfhjmvX4XrI1uqHM8vagdBHAjSxmyC5ghQglf.llMub.	59	t	\N	\N
29	anne.girard@test-import.fr	$2b$12$mxXfdDJ7PRfhjmvX4XrI1uqHM8vagdBHAjSxmyC5ghQglf.llMub.	60	t	\N	\N
30	paul.girardin@test-import.fr	$2b$12$mxXfdDJ7PRfhjmvX4XrI1uqHM8vagdBHAjSxmyC5ghQglf.llMub.	61	t	\N	\N
31	sophie.chevalier@test-import.fr	$2b$12$mxXfdDJ7PRfhjmvX4XrI1uqHM8vagdBHAjSxmyC5ghQglf.llMub.	62	t	\N	\N
32	passerelle_usertest_1@dm-informatique.fr	$2b$12$mxXfdDJ7PRfhjmvX4XrI1uqHM8vagdBHAjSxmyC5ghQglf.llMub.	63	t	\N	\N
33	passerelle_usertest_2@dm-informatique.fr	$2b$12$mxXfdDJ7PRfhjmvX4XrI1uqHM8vagdBHAjSxmyC5ghQglf.llMub.	64	t	\N	\N
34	passerelle_usertest_3@dm-informatique.fr	$2b$12$mxXfdDJ7PRfhjmvX4XrI1uqHM8vagdBHAjSxmyC5ghQglf.llMub.	65	t	\N	\N
35	passerelle_usertest_4@dm-informatique.fr	$2b$12$mxXfdDJ7PRfhjmvX4XrI1uqHM8vagdBHAjSxmyC5ghQglf.llMub.	66	t	\N	\N
15	pierre.martin	$2b$12$mxXfdDJ7PRfhjmvX4XrI1uqHM8vagdBHAjSxmyC5ghQglf.llMub.	39	t	\N	\N
\.


--
-- Data for Name: veut_aller_a; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.veut_aller_a (id_fiche_de_voeux, id_region, degre) FROM stdin;
21	13	Non
21	18	P1
21	17	P2
21	14	P3
21	16	P4
21	15	P5
22	13	Non
22	18	Non
22	17	Non
22	14	Non
22	16	Non
22	15	Non
23	13	Non
23	18	P2
23	17	P1
23	14	P5
23	16	P3
23	15	P6
\.


--
-- Data for Name: veut_habiter_dans; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.veut_habiter_dans (id_fiche_de_voeux, id_hebergement) FROM stdin;
22	7
23	9
23	7
21	8
21	9
21	7
\.


--
-- Data for Name: veut_partir_pour; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.veut_partir_pour (id_fiche_de_voeux, id_duree, projet_duree_specifique) FROM stdin;
17	10	\N
18	11	\N
20	13	3 mois, mission exploratoire
19	12	\N
24	14	\N
25	11	\N
26	12	\N
22	14	\N
23	10	\N
23	11	\N
21	10	\N
\.


--
-- Data for Name: veut_vivre_dans; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.veut_vivre_dans (id_fiche_de_voeux, id_environnement) FROM stdin;
19	12
19	10
22	10
23	10
23	9
21	10
\.


--
-- Name: adresse_id_adresse_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.adresse_id_adresse_seq', 28, true);


--
-- Name: candidat_id_candidat_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.candidat_id_candidat_seq', 51, true);


--
-- Name: competences_id_competences_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.competences_id_competences_seq', 107, true);


--
-- Name: contact_id_contact_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.contact_id_contact_seq', 67, true);


--
-- Name: criteres_detailles_id_criteres_detailles_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.criteres_detailles_id_criteres_detailles_seq', 4692, true);


--
-- Name: domaine_id_domaine_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.domaine_id_domaine_seq', 52, true);


--
-- Name: duree_id_duree_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.duree_id_duree_seq', 16, true);


--
-- Name: environnement_id_environnement_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.environnement_id_environnement_seq', 12, true);


--
-- Name: etape_id_historique_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.etape_id_historique_seq', 32, true);


--
-- Name: etat_opportunite_id_etat_opportunite_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.etat_opportunite_id_etat_opportunite_seq', 14, true);


--
-- Name: etat_poste_id_etat_poste_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.etat_poste_id_etat_poste_seq', 6, true);


--
-- Name: fiche_de_poste_id_poste_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.fiche_de_poste_id_poste_seq', 106, true);


--
-- Name: fiche_de_voeux_id_fiche_de_voeux_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.fiche_de_voeux_id_fiche_de_voeux_seq', 27, true);


--
-- Name: hebergement_id_hebergement_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.hebergement_id_hebergement_seq', 9, true);


--
-- Name: historique_poste_id_historique_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.historique_poste_id_historique_seq', 2, true);


--
-- Name: langue_id_langue_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.langue_id_langue_seq', 16, true);


--
-- Name: niveau_langue_id_niveau_langue_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.niveau_langue_id_niveau_langue_seq', 12, true);


--
-- Name: notoriete_dcc_id_notoriete_dcc_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.notoriete_dcc_id_notoriete_dcc_seq', 24, true);


--
-- Name: opportunite_id_opportunite_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.opportunite_id_opportunite_seq', 361, true);


--
-- Name: pays_id_pays_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.pays_id_pays_seq', 126, true);


--
-- Name: region_id_region_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.region_id_region_seq', 18, true);


--
-- Name: stages_id_stages_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.stages_id_stages_seq', 1, false);


--
-- Name: type_billet_avion_id_type_billet_avion_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.type_billet_avion_id_type_billet_avion_seq', 12, true);


--
-- Name: user__id_user_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.user__id_user_seq', 36, true);


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


--
-- Name: adresse adresse_id_pays_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.adresse
    ADD CONSTRAINT adresse_id_pays_fkey FOREIGN KEY (id_pays) REFERENCES public.pays(id_pays);


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

\unrestrict iYOMFFqaW67AqSkuYyxbBxWfNG4QFbkDG2p3NNE98IEvMvzOZDRJmhGbE3QI13l

