-- Historisation unique des commentaires d'opportunité (Retour_19, 19/09/2026).
-- Remplace appreciation_recruteur / commentaire_charge_mission (colonnes uniques
-- réécrites à chaque étape, donc perdant l'historique) et les 2 sous-requêtes
-- candidat-larges pour "commentaire_candidat"/"commentaire_validation_recruteur"
-- (qui mélangeaient les commentaires entre opportunités différentes d'un même
-- candidat) par une seule colonne JSONB enrichie à chaque transition.

ALTER TABLE opportunite ADD COLUMN IF NOT EXISTS historique jsonb NOT NULL DEFAULT '[]'::jsonb;

-- Base de test uniquement (V1, pré-prod) : pas de migration des anciennes valeurs,
-- elles étaient déjà incorrectes/mélangées. Un RAZ ou DROP/CREATE reste possible
-- sans perte réelle si besoin.
ALTER TABLE opportunite DROP COLUMN IF EXISTS appreciation_recruteur;
ALTER TABLE opportunite DROP COLUMN IF EXISTS commentaire_charge_mission;
