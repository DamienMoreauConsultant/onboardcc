BEGIN;

ALTER TABLE opportunite
  ADD COLUMN IF NOT EXISTS flag_opportunite_obsolete BOOLEAN DEFAULT FALSE;

UPDATE opportunite
SET flag_opportunite_obsolete=FALSE
WHERE flag_opportunite_obsolete IS NULL;

ALTER TABLE opportunite
  ALTER COLUMN flag_opportunite_obsolete SET NOT NULL;

ALTER TABLE opportunite
  ALTER COLUMN note_contexte TYPE NUMERIC(8,2),
  ALTER COLUMN note_mission TYPE NUMERIC(8,2),
  ALTER COLUMN note_warning TYPE NUMERIC(8,2);

ALTER TABLE criteres_detailles
  ALTER COLUMN note_obtenue TYPE NUMERIC(8,2);

CREATE INDEX IF NOT EXISTS idx_opportunite_poste
  ON opportunite(id_poste);

CREATE INDEX IF NOT EXISTS idx_opportunite_fiche_voeux
  ON opportunite(id_fiche_de_voeux);

CREATE INDEX IF NOT EXISTS idx_criteres_detailles_opportunite
  ON criteres_detailles(id_opportunite, date_evaluation DESC);

COMMIT;