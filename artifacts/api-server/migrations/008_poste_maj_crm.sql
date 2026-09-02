BEGIN;

-- Le CRM est le référentiel maître des postes. Sa date de dernière mise à jour
-- est stockée séparément de la date du dernier recalcul effectué par le scoring.
ALTER TABLE fiche_de_poste
  ADD COLUMN IF NOT EXISTS date_maj_crm DATE,
  ADD COLUMN IF NOT EXISTS date_dernier_recalcul_score DATE;

-- Le besoin de recalcul sera déterminé de manière autonome par le module de
-- scoring ; l'import ne maintient donc plus ce drapeau historique.
ALTER TABLE fiche_de_poste
  DROP COLUMN IF EXISTS flag_update_score;

COMMIT;