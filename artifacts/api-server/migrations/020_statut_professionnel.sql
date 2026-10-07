-- UAT-01 (07/10/2026) : le statut professionnel du candidat devient une liste fermée gérée dans
-- l'Admin (Référentiels). Le candidat ne mémorise plus un texte libre (candidat.profil_statut,
-- VARCHAR(20)) mais un LIEN vers la valeur choisie (id Passerelle, jamais le crm_key : si le
-- crm_key change côté site web, les données déjà en base restent justes).
--
-- La reprise des valeurs déjà saisies ignore la casse, les accents et les apostrophes. Les valeurs
-- non reconnues sont laissées vides et AFFICHÉES (messages NOTICE) avant la suppression de l'ancienne
-- colonne : faire une sauvegarde de la base avant de lancer ce script (la suppression est définitive).
--
-- Compatible PostgreSQL 9.6.

BEGIN;

CREATE TABLE IF NOT EXISTS statut_professionnel (
  id_statut_professionnel SERIAL PRIMARY KEY,
  crm_key VARCHAR(40) NOT NULL UNIQUE,
  designation VARCHAR(50) NOT NULL UNIQUE,
  active BOOLEAN NOT NULL DEFAULT TRUE
);

INSERT INTO statut_professionnel (crm_key, designation, active) VALUES
  ('ETUDIANT', 'Étudiant', TRUE),
  ('SALARIE', 'Salarié', TRUE),
  ('PROFESSION_LIBERALE', 'Profession libérale', TRUE),
  ('EN_RECHERCHE_EMPLOI', 'En recherche d''emploi', TRUE),
  ('FONCTIONNAIRE', 'Fonctionnaire', TRUE),
  ('RETRAITE', 'Retraité', TRUE)
ON CONFLICT (crm_key) DO NOTHING;

ALTER TABLE candidat ADD COLUMN IF NOT EXISTS id_statut_professionnel INTEGER REFERENCES statut_professionnel(id_statut_professionnel);

-- Reprise des données : on ne touche qu'aux candidats dont le statut est encore à rattacher, et
-- seulement si l'ancienne colonne existe encore (script rejouable sans erreur).
DO $$
DECLARE
  r RECORD;
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema = 'public' AND table_name = 'candidat' AND column_name = 'profil_statut') THEN
    EXECUTE $sql$
      UPDATE candidat c
         SET id_statut_professionnel = s.id_statut_professionnel
        FROM statut_professionnel s
       WHERE c.id_statut_professionnel IS NULL
         AND c.profil_statut IS NOT NULL
         AND s.crm_key = CASE lower(translate(btrim(replace(c.profil_statut, '’', '''')), 'ÉÈÊËÀÂÄÎÏÔÖÙÛÜÇéèêëàâäîïôöùûüç', 'EEEEAAAIIOOUUUCeeeeaaaiioouuuc'))
               WHEN 'etudiant' THEN 'ETUDIANT'
               WHEN 'salarie' THEN 'SALARIE'
               WHEN 'profession liberale' THEN 'PROFESSION_LIBERALE'
               WHEN 'independant' THEN 'PROFESSION_LIBERALE'
               WHEN 'en recherche d''emploi' THEN 'EN_RECHERCHE_EMPLOI'
               WHEN 'recherche d''emploi' THEN 'EN_RECHERCHE_EMPLOI'
               WHEN 'sans emploi' THEN 'EN_RECHERCHE_EMPLOI'
               WHEN 'fonctionnaire' THEN 'FONCTIONNAIRE'
               WHEN 'retraite' THEN 'RETRAITE'
               ELSE NULL END
    $sql$;

    FOR r IN
      SELECT id_candidat, profil_statut
        FROM candidat
       WHERE id_statut_professionnel IS NULL AND btrim(COALESCE(profil_statut, '')) <> ''
       ORDER BY id_candidat
    LOOP
      RAISE NOTICE 'Statut professionnel non repris — candidat % : "%" (à renseigner à la main)', r.id_candidat, r.profil_statut;
    END LOOP;

    EXECUTE 'ALTER TABLE candidat DROP COLUMN profil_statut';
  END IF;
END $$;

COMMIT;
