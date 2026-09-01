-- Le module Admin générique attend une colonne active pour afficher et modifier
-- le statut des référentiels. Les niveaux existants restent actifs par défaut.
ALTER TABLE niveau_langue
  ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT true;