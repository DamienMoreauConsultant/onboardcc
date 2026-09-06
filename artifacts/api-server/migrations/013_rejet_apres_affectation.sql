UPDATE etat_opportunite
SET active=TRUE
WHERE designation='Rejet après affectation';

INSERT INTO etat_opportunite(designation, active)
SELECT 'Rejet après affectation', TRUE
WHERE NOT EXISTS (
  SELECT 1
  FROM etat_opportunite
  WHERE designation='Rejet après affectation'
);