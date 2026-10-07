-- UAT-08 / D8 (07/10/2026) : les textes des emails envoyés par Passerelle ne sont plus figés dans le
-- code ; l'administrateur les modifie depuis Admin > Modèle d'email. Une ligne par type d'email.
--
--   frequence_heures : 0 = envoi immédiat. Une valeur > 0 n'a de sens que pour NOTIFICATION_CM
--                      (mail groupé au plus toutes les X heures) ; les autres modèles restent à 0.
--   contenu          : texte brut, variables entre accolades ({prenom}, {identifiant}, {mot_de_passe},
--                      {lien}, {role}, {nombre}) remplacées à l'envoi.
--
-- Les textes ci-dessous reprennent EXACTEMENT les textes qui étaient dans le code (le jour de la
-- livraison, aucun email ne change), sauf les deux nouveaux modèles (NOTIFICATION_CM, CHANGEMENT_EMAIL).
-- Compatible PostgreSQL 9.6.

BEGIN;

CREATE TABLE IF NOT EXISTS email_template (
  email_type VARCHAR(40) PRIMARY KEY,
  libelle VARCHAR(100) NOT NULL,
  objet VARCHAR(150) NOT NULL,
  contenu VARCHAR(3000) NOT NULL,
  frequence_heures INTEGER NOT NULL DEFAULT 0 CHECK (frequence_heures >= 0 AND frequence_heures <= 168)
);

INSERT INTO email_template (email_type, libelle, objet, contenu, frequence_heures) VALUES
  ('INVITATION_CANDIDAT', 'Invitation du candidat (création du compte)', 'Votre espace candidat DCC',
'Bonjour {prenom},

Votre espace candidat DCC est prêt.
Identifiant : {identifiant}
Mot de passe temporaire : {mot_de_passe}

Connectez-vous puis changez ce mot de passe dès votre première connexion.', 0),
  ('INVITATION_CM', 'Invitation du chargé de mission (import des postes)', 'Votre accès DCC',
'Bonjour {prenom},

Votre compte DCC (CM) est prêt.
Identifiant : {identifiant}
Mot de passe temporaire : {mot_de_passe}

Connectez-vous puis changez ce mot de passe dès votre première connexion.', 0),
  ('INVITATION_UTILISATEUR', 'Invitation d''un utilisateur créé par l''administrateur', 'Votre accès DCC',
'Bonjour {prenom},

Votre compte DCC ({role}) est prêt.
Identifiant : {identifiant}
Mot de passe temporaire : {mot_de_passe}

Connectez-vous puis changez ce mot de passe dès votre première connexion.', 0),
  ('NOTIFICATION_CM', 'Notifications groupées du chargé de mission', 'Nouvelles notifications Passerelle',
'Bonjour {prenom},

Vous avez de nouvelles notifications dans Passerelle que vous pouvez consulter sur votre Home page.

Accéder à Passerelle : {lien}', 1),
  ('CHANGEMENT_EMAIL', 'Changement d''adresse email (nouvel identifiant)', 'Votre identifiant Passerelle a changé',
'Bonjour {prenom},

L''adresse email de votre compte Passerelle a été mise à jour : votre identifiant de connexion est désormais {identifiant}.

Vous pouvez choisir un nouveau mot de passe depuis la page de connexion, avec « Mot de passe oublié » :
{lien}

Si vous n''êtes pas à l''origine de cette modification, contactez la DCC.', 0),
  ('REINITIALISATION_MDP', 'Réinitialisation du mot de passe', 'Réinitialisation de votre mot de passe DCC',
'Bonjour {prenom},

Une demande de réinitialisation a été effectuée pour votre espace DCC.
Utilisez le lien ci-dessous dans les 30 minutes pour choisir un nouveau mot de passe :
{lien}

Si vous n’êtes pas à l’origine de cette demande, contactez la DCC.', 0)
ON CONFLICT (email_type) DO NOTHING;

COMMIT;
