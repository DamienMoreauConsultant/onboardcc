-- Élargit criteres_detailles.valeur_poste/valeur_candidat de VARCHAR(50) à TEXT.
-- Ces colonnes stockaient jusqu'ici une liste de libellés jointe puis tronquée à 50
-- caractères sans avertissement (voir la fonction short() dans services/matching.ts) —
-- perte de données silencieuse constatée sur le critère "Compétences" (18/09/2026, retour
-- de test Damien). TEXT est illimité en PostgreSQL, sans coût de stockage supplémentaire
-- pour les valeurs courtes déjà en place (stockage en longueur variable, comme VARCHAR).
ALTER TABLE criteres_detailles ALTER COLUMN valeur_poste TYPE TEXT;
ALTER TABLE criteres_detailles ALTER COLUMN valeur_candidat TYPE TEXT;
