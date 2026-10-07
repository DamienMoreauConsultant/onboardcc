-- UAT-06 (07/10/2026) : notifications des chargés de mission (CM). Une ligne par événement sur
-- une opportunité d'un poste dont le contact est CM. Aucun nom de candidat n'est recopié ici : le
-- texte affiché est reconstruit à la lecture à partir de l'opportunité (donc supprimé avec elle).
--
--   consulte          : FALSE tant que le CM n'a pas cliqué sur la ligne (mise en gras à l'écran)
--   date_envoi_mail   : NULL tant qu'aucun mail n'a signalé cet événement au CM
--
-- Les notifications de plus de 90 jours sont purgées par le traitement d'envoi.
-- Compatible PostgreSQL 9.6.

BEGIN;

CREATE TABLE IF NOT EXISTS notification_cm (
  id_notification SERIAL PRIMARY KEY,
  id_contact INTEGER NOT NULL REFERENCES contact(id_contact) ON DELETE CASCADE,
  id_opportunite INTEGER NOT NULL REFERENCES opportunite(id_opportunite) ON DELETE CASCADE,
  type_evenement VARCHAR(40) NOT NULL,
  date_evenement TIMESTAMP NOT NULL DEFAULT now(),
  consulte BOOLEAN NOT NULL DEFAULT FALSE,
  date_consultation TIMESTAMP,
  date_envoi_mail TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notification_cm_contact ON notification_cm (id_contact, date_evenement DESC);
CREATE INDEX IF NOT EXISTS idx_notification_cm_a_envoyer ON notification_cm (id_contact) WHERE date_envoi_mail IS NULL;

COMMIT;
