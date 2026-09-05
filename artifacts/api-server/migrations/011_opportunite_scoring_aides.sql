INSERT INTO aide_contextuelle(cle_champ, texte, active) VALUES
  (
    'score_note_mission',
    'Cette note évalue si les compétences du candidat correspondent aux compétences demandées par le poste. Elle atteint son maximum si le candidat possède toutes les compétences demandées.',
    TRUE
  ),
  (
    'score_competences',
    'Note maximale si le candidat possède toutes les compétences demandées par le poste. Note un peu plus basse s''il en possède au moins une. Note intermédiaire s''il a étudié ou travaillé dans le même domaine sans avoir la compétence précise. Note nulle sinon.',
    TRUE
  ),
  (
    'score_note_contexte',
    'Cette note est la moyenne de 6 critères qui mesurent si les conditions de vie et d''organisation du poste correspondent aux souhaits du candidat : la région, la date de départ, le type d''environnement, le logement, la durée de la mission et la langue. Plus la moyenne est élevée, plus les conditions générales sont compatibles.',
    TRUE
  ),
  (
    'score_region',
    'Compare la région du poste à la préférence exprimée par le candidat pour cette région (de "n''y va pas" à "1er choix"). Plus la région est un choix prioritaire pour le candidat, plus la note est élevée.',
    TRUE
  ),
  (
    'score_date_depart',
    'Compare la date à laquelle le candidat peut partir à la date d''arrivée souhaitée par le poste. Plus l''écart entre les deux dates est faible, plus la note est élevée ; elle est maximale si les deux dates correspondent exactement.',
    TRUE
  ),
  (
    'score_environnement',
    'Compare le milieu de vie du poste (urbain, rural...) aux milieux de vie acceptés par le candidat. Note maximale en cas de correspondance exacte, note réduite si l''écart est faible, note nulle sinon.',
    TRUE
  ),
  (
    'score_logement_couple',
    'Vérifie si le logement proposé par le poste correspond à la situation du candidat. S''il part seul, vérifie que le logement lui convient. S''il part en couple ou en famille, vérifie que le poste permet également un poste ou un accueil pour la personne qui l''accompagne.',
    TRUE
  ),
  (
    'score_duree',
    'Compare la durée de la mission proposée par le poste aux durées acceptées par le candidat. Note maximale en cas de correspondance exacte, note réduite si l''écart est faible, note nulle sinon.',
    TRUE
  ),
  (
    'score_langue',
    'Vérifie si le candidat parle la langue requise par le poste, et à quel niveau. Une note intermédiaire est accordée si le candidat est prêt à apprendre une nouvelle langue.',
    TRUE
  ),
  (
    'score_note_alerte',
    'Ce pictogramme signale un point de vigilance sur 3 critères sensibles : la zone à risque, la proximité d''un hôpital et des conditions de vie sommaires. Vert : aucun point de vigilance. Jaune : un point existe mais le candidat l''a accepté. Rouge : un point existe et n''est pas couvert — à examiner avant de poursuivre.',
    TRUE
  ),
  (
    'score_zone_orange',
    'Signale si le poste est situé dans une zone jugée à risque, et si le candidat a accepté ou non cette condition.',
    TRUE
  ),
  (
    'score_hopital_proche',
    'Signale si le candidat a besoin d''être proche d''un hôpital pour des raisons de santé, et si le poste répond ou non à ce besoin.',
    TRUE
  ),
  (
    'score_conditions_spartiates',
    'Signale si le poste implique des conditions de vie sommaires, et si le candidat a accepté ou non cette condition.',
    TRUE
  )
ON CONFLICT (cle_champ) DO UPDATE
SET texte = EXCLUDED.texte,
    active = EXCLUDED.active;