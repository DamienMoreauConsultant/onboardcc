---
name: Couverture des destinations
description: Règle de complétude des préférences régionales dans une fiche de vœux DCC.
---

Chaque sauvegarde de vœux doit envoyer une préférence pour toutes les régions actives, avec un degré appartenant exactement à P1, P2, P3, P4, P5, P6 ou Non.

**Why:** L’interface affiche toutes les régions même lorsque la base ne contient encore qu’une liste partielle. Sérialiser uniquement l’état brut rend une sauvegarde apparemment valide mais bloque ensuite la soumission pour couverture incomplète.

**How to apply:** Construire le payload depuis la liste complète affichée et normalisée, pas seulement depuis les relations déjà persistées ou explicitement modifiées.