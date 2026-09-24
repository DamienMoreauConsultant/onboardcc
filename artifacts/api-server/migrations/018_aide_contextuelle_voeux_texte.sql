-- Retour_23 (23/09/2026) : les 23 tooltips de la fiche de vœux, créés par la migration 010 avec un
-- texte de test ('blabla_01'...'blabla_23'), n'avaient jamais été rédigés, et n'avaient jamais été
-- reportés dans le script de reset consolidé (prompt_0) — ce qui les rendait absents sur toute base
-- réinitialisée depuis ce script. Ce fichier upserte le vrai contenu de ces 23 tooltips, que la base
-- ait ou non déjà les lignes de la migration 010.

INSERT INTO aide_contextuelle (cle_champ, texte) VALUES
  ('domaines_formation', 'Précise le ou les domaines dans lesquels tu as suivi une formation ou obtenu un diplôme. Cela aide à te proposer des postes en lien avec ton parcours.'),
  ('domaines_experience', 'Précise le ou les domaines dans lesquels tu as une expérience professionnelle ou bénévole, même sans diplôme associé.'),
  ('profil_experience_engagement_detail', 'Décris en quelques mots tes engagements associatifs, professionnels ou bénévoles passés : structure, durée, missions confiées.'),
  ('langues', 'Indique les langues que tu parles et ton niveau pour chacune (Notions, Parlé, Courant, Natif) : cela permet de te proposer des missions où tu pourras communiquer.'),
  ('date_depart_souhaite', 'Indique la date à partir de laquelle tu es disponible pour partir. Plus elle est proche de la date attendue par un poste, mieux la mission te correspond.'),
  ('durees', 'Sélectionne la ou les durées de mission qui te conviennent (par exemple 6 mois, 1 an, 2 ans...). Tu peux en choisir plusieurs.'),
  ('fonctionnaire_dispo_demandee', 'Si tu es fonctionnaire, précise si tu as demandé, ou si tu vas demander, une disponibilité à ton administration pour partir en mission.'),
  ('nouvelle_langue', 'Indique si tu es prêt à apprendre une nouvelle langue pour ta mission, même si tu ne la parles pas encore aujourd''hui.'),
  ('nouveau_poste', 'Indique si tu es prêt à occuper un poste différent de ton métier ou de ta formation d''origine.'),
  ('environnements', 'Précise le type de cadre de vie que tu préfères (urbain, rural, grande ville...). Tu peux en choisir plusieurs.'),
  ('hebergements', 'Précise le type de logement qui te convient sur place (seul, colocation, en famille...).'),
  ('zone_orange', 'Indique si tu acceptes d''être affecté dans une zone signalée comme présentant un risque particulier (zone orange).'),
  ('conditions_spartiates', 'Indique si tu acceptes des conditions de vie sommaires sur ta mission (accès limité au confort, à l''eau, à l''électricité...).'),
  ('hopital_proche', 'Indique si tu as besoin d''être à proximité d''un hôpital pour des raisons de santé, les tiennes ou celles d''un proche qui t''accompagne.'),
  ('regions', 'Précise en face de chaque région si tu souhaites ou non y aller. Tu peux aussi indiquer un ordre de préférence en utilisant les valeurs P1 (préférée) à P6.'),
  ('competences', 'Indique les compétences que tu peux mettre au service d''une mission, et ton niveau pour chacune, pour te proposer des postes qui correspondent vraiment à ce que tu sais faire.'),
  ('competences_a_developper', 'Précise si tu souhaites profiter de ta mission pour apprendre ou développer une compétence en particulier.'),
  ('centres_interret', 'Indique tes centres d''intérêt personnels (sport, musique, artisanat...) : cela aide à mieux cerner ton profil au-delà de ton parcours professionnel.'),
  ('part_seul', 'Indique si le candidat part seul ou accompagné (couple, famille) — utile pour évaluer la compatibilité avec le logement proposé par le poste.'),
  ('annonces_recherchees', 'Note ici les annonces de postes que le candidat a lui-même repérées et transmises, en dehors des correspondances calculées automatiquement.'),
  ('engagements', 'Note ici les engagements associatifs ou professionnels du candidat identifiés par le chargé de recrutement, en complément du détail donné par le candidat lui-même.'),
  ('categorie_ecclesiale', 'Indique si le candidat est sensible à la démarche ecclésiale du partenaire d''accueil.'),
  ('categorie_ecclesiale_detail', 'Précise, si besoin, la nature de l''engagement ou de la sensibilité ecclésiale du candidat.')
ON CONFLICT (cle_champ) DO UPDATE SET texte = EXCLUDED.texte;
