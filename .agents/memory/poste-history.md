---
name: Historique des postes
description: Contrainte du schéma existant pour historiser les actions sur une fiche de poste.
---

Le schéma initial lie `etape` exclusivement à un candidat (`id_candidat` obligatoire) et ne contient pas de `id_poste`. Les événements de fermeture/réouverture d’une fiche de poste doivent donc être stockés dans une structure d’historique dédiée au poste, sans fabriquer une liaison candidat.

**Why:** Insérer une action de poste dans `etape` créerait une fausse relation candidat et violerait la clé étrangère si aucun candidat n’est associé.

**How to apply:** Avant tout futur module qui historise une fiche de poste, réutiliser l’historique dédié au poste et conserver `etape` pour les transitions candidat.