-- Retour_29 (24/09/2026) : le pays d'une adresse de contact (candidat, MIS, PAR) n'est plus une
-- référence vers le référentiel `pays` (pays de mission uniquement) mais un simple texte importé
-- tel quel du système source, qui reste garant de sa qualité. Le référentiel `pays` ne sert plus
-- qu'à situer un poste (fiche_de_poste.id_pays) et n'a donc plus à contenir tous les pays du monde.
--
-- Les adresses déjà en base gardent leur pays : la désignation est recopiée en texte avant la
-- suppression de l'ancienne colonne.

BEGIN;

ALTER TABLE adresse ADD COLUMN IF NOT EXISTS pays VARCHAR(50);

UPDATE adresse a
   SET pays = LEFT(p.designation, 50)
  FROM pays p
 WHERE p.id_pays = a.id_pays
   AND a.pays IS NULL;

ALTER TABLE adresse DROP CONSTRAINT IF EXISTS adresse_id_pays_fkey;
ALTER TABLE adresse DROP COLUMN IF EXISTS id_pays;

COMMIT;
