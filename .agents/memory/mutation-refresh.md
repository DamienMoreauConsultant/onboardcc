---
name: Rafraîchissement après mutation
description: Règle de synchronisation des fiches après sauvegarde ou transition sans perdre les brouillons.
---

Après toute sauvegarde ou transition réussie, la fiche concernée doit relire son détail depuis l’API et remplacer les données de lecture locales. Une réponse fraîche doit aussi effacer toute erreur issue d’une tentative précédente.

**Why:** Mettre à jour seulement un verrou ou une liste imbriquée produit un écran incohérent : certaines sections reflètent la base tandis que le badge, le bandeau d’erreur ou la fiche parente restent obsolètes. Un rafraîchissement avec écran de chargement peut en plus démonter et perdre un autre formulaire en cours.

**How to apply:** Faire un re-fetch de fond du GET de détail après la mutation, sans rechargement navigateur et sans masquer la page. Protéger les réponses concurrentes, préserver l’état des sections encore en édition et notifier la fiche parente lorsqu’une mutation imbriquée change aussi le poste ou le candidat.