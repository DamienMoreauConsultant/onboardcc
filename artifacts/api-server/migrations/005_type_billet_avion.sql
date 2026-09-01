BEGIN;

CREATE TABLE IF NOT EXISTS type_billet_avion (
  id_type_billet_avion SERIAL PRIMARY KEY,
  crm_key VARCHAR(100) NOT NULL UNIQUE,
  designation VARCHAR(150) NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE
);

INSERT INTO type_billet_avion (crm_key, designation, active) VALUES
  ('PARTENAIRE', 'Partenaire', TRUE),
  ('DCC', 'DCC', TRUE),
  ('VOLONTAIRE', 'Volontaire', TRUE)
ON CONFLICT (crm_key) DO NOTHING;

ALTER TABLE fiche_de_poste
  ADD COLUMN IF NOT EXISTS id_type_billet_avion INTEGER;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN unnest(c.conkey) AS key(attnum) ON TRUE
    JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = key.attnum
    WHERE c.conrelid = 'fiche_de_poste'::regclass
      AND c.contype = 'f'
      AND a.attname = 'id_type_billet_avion'
  ) THEN
    ALTER TABLE fiche_de_poste
      ADD CONSTRAINT fiche_de_poste_type_billet_avion_fkey
      FOREIGN KEY (id_type_billet_avion) REFERENCES type_billet_avion(id_type_billet_avion);
  END IF;
END $$;

-- Migration best-effort pour les anciennes fiches encore porteuses du booléen.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'fiche_de_poste'
      AND column_name = 'billet_avion'
  ) THEN
    EXECUTE $migration$
      UPDATE fiche_de_poste
      SET id_type_billet_avion = (
        SELECT id_type_billet_avion FROM type_billet_avion WHERE crm_key = 'DCC'
      )
      WHERE billet_avion IS TRUE AND id_type_billet_avion IS NULL
    $migration$;
  END IF;
END $$;

ALTER TABLE fiche_de_poste DROP COLUMN IF EXISTS billet_avion;

COMMIT;