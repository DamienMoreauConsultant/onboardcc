-- Ajoute une contrainte d'unicité (id_opportunite, critere) sur criteres_detailles, pour
-- permettre un UPSERT (INSERT ... ON CONFLICT ... DO UPDATE) au lieu d'un simple INSERT à
-- chaque recalcul de score. Avant cette migration, chaque recalcul ajoutait de nouvelles lignes
-- sans jamais nettoyer les anciennes : plusieurs lignes pouvaient coexister pour le même couple
-- (opportunité, critère), avec un risque d'affichage d'une ligne périmée. Décision prise avec
-- Damien le 19/09/2026 (Retour_10) : la DCC n'a besoin que de l'état courant des critères, pas
-- d'un historique ligne par ligne (l'historisation des vœux se fera plus tard par export PDF
-- daté, séparément).
-- Nettoyage préalable indispensable : la contrainte UNIQUE ci-dessous échoue si des doublons
-- existent déjà (conséquence directe du bug corrigé ici). On ne garde que la ligne la plus
-- récente (id le plus élevé) par couple (id_opportunite, critere).
DELETE FROM criteres_detailles a
USING criteres_detailles b
WHERE a.id_opportunite = b.id_opportunite
  AND a.critere = b.critere
  AND a.id_criteres_detailles < b.id_criteres_detailles;

ALTER TABLE criteres_detailles
  ADD CONSTRAINT criteres_detailles_opportunite_critere_key UNIQUE (id_opportunite, critere);
