ALTER TABLE fiche_de_voeux
  ALTER COLUMN fonctionnaire_dispo_demandee TYPE VARCHAR(50)
  USING (
    CASE
      WHEN fonctionnaire_dispo_demandee = true THEN 'OUI'
      WHEN fonctionnaire_dispo_demandee = false THEN 'NON'
      ELSE NULL
    END
  );

ALTER TABLE fiche_de_voeux
  ADD CONSTRAINT fiche_de_voeux_fonctionnaire_dispo_demandee_check
  CHECK (
    fonctionnaire_dispo_demandee IS NULL
    OR fonctionnaire_dispo_demandee IN ('OUI', 'NON', 'NON APPLICABLE')
  );

CREATE TABLE aide_contextuelle (
  id_aide_contextuelle SERIAL PRIMARY KEY,
  cle_champ VARCHAR(100) NOT NULL UNIQUE,
  texte VARCHAR(500) NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE
);

INSERT INTO aide_contextuelle(cle_champ, texte) VALUES
  ('domaines_formation', 'blabla_01'),
  ('domaines_experience', 'blabla_02'),
  ('profil_experience_engagement_detail', 'blabla_03'),
  ('langues', 'blabla_04'),
  ('date_depart_souhaite', 'blabla_05'),
  ('durees', 'blabla_06'),
  ('fonctionnaire_dispo_demandee', 'blabla_07'),
  ('nouvelle_langue', 'blabla_08'),
  ('nouveau_poste', 'blabla_09'),
  ('environnements', 'blabla_10'),
  ('hebergements', 'blabla_11'),
  ('zone_orange', 'blabla_12'),
  ('conditions_spartiates', 'blabla_13'),
  ('hopital_proche', 'blabla_14'),
  ('regions', 'blabla_15'),
  ('competences', 'blabla_16'),
  ('competences_a_developper', 'blabla_17'),
  ('centres_interret', 'blabla_18'),
  ('part_seul', 'blabla_19'),
  ('annonces_recherchees', 'blabla_20'),
  ('engagements', 'blabla_21'),
  ('categorie_ecclesiale', 'blabla_22'),
  ('categorie_ecclesiale_detail', 'blabla_23');