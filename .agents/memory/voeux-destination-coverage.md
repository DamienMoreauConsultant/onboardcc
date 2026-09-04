---
name: Couverture des destinations
description: Règle de complétude des préférences régionales dans une fiche de vœux DCC.
---

Chaque sauvegarde de vœux doit envoyer une ligne pour toutes les régions actives. Un brouillon peut conserver un degré neutre (`NULL`) ; une soumission exige exactement OUI, P1, P2, P3, P4, P5, P6 ou Non pour chaque région.

La complétude de soumission ne doit porter que sur les champs accessibles au candidat. `part_seul`, `categorie_ecclesiale` et son détail appartiennent à l’Avis DCC et ne bloquent jamais une soumission ; les centres d’intérêt sont candidat-éditables mais facultatifs.

**Why:** L’interface affiche toutes les régions même lorsque la base ne contient encore qu’une liste partielle. Sérialiser uniquement l’état brut rend une sauvegarde apparemment valide mais bloque ensuite la soumission pour couverture incomplète.

**How to apply:** Construire le payload depuis la liste complète affichée, pas seulement depuis les relations déjà persistées ou modifiées. Accepter l’état neutre lors d’un enregistrement, mais contrôler toutes les valeurs lors de la soumission.