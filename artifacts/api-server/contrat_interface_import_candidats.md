# Contrat d’interface — import des candidats

## Champ `fonctionnaire_dispo_demandee`

Ce champ n’est pas importé depuis le fichier candidat. Il est renseigné et modifié uniquement depuis la fiche de vœux par le candidat ou le recruteur.

- Type applicatif : `VARCHAR(50)` nullable.
- Valeurs métier autorisées : `OUI`, `NON`, `NON APPLICABLE`.
- `NULL` signifie « non renseigné » et reste distinct de `NON APPLICABLE`.

La conversion des anciennes données conserve leur sens : `true` devient `OUI`, `false` devient `NON` et `NULL` reste `NULL`.