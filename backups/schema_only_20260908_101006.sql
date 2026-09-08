--
-- PostgreSQL database dump
--

\restrict 1cDkWy5dh4WkGVOx9uLymKpKNwIqACS7dGfUlyh4eO0EuAjIm2AOg75pvSX0EMa

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

\unrestrict 1cDkWy5dh4WkGVOx9uLymKpKNwIqACS7dGfUlyh4eO0EuAjIm2AOg75pvSX0EMa

