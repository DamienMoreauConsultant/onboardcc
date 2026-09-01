-- Le code applicatif utilise désormais exclusivement les clés étrangères
-- vers niveau_langue. Les contrôles de migration doivent être à zéro avant
-- d'exécuter ce nettoyage.
DO $$
DECLARE
  unresolved_parle BIGINT := 0;
  unresolved_postes BIGINT := 0;
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'parle' AND column_name = 'niveau'
  ) THEN
    EXECUTE 'SELECT COUNT(*) FROM parle WHERE niveau IS NOT NULL AND id_niveau_langue IS NULL'
      INTO unresolved_parle;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'langue_poste' AND column_name = 'niveau_requis'
  ) THEN
    EXECUTE 'SELECT COUNT(*) FROM langue_poste WHERE niveau_requis IS NOT NULL AND id_niveau_langue IS NULL'
      INTO unresolved_postes;
  END IF;

  IF unresolved_parle > 0 OR unresolved_postes > 0 THEN
    RAISE EXCEPTION
      'Nettoyage annulé : % niveau(x) candidat et % niveau(x) poste restent non résolus',
      unresolved_parle, unresolved_postes;
  END IF;
END
$$;

ALTER TABLE parle
  DROP COLUMN IF EXISTS niveau;

ALTER TABLE langue_poste
  DROP COLUMN IF EXISTS niveau_requis;