---
name: Périmètre CHZ sur les postes
description: Règle combinant droits d’action recruteur et visibilité restreinte pour le rôle CHZ.
---

Un CHZ dispose des mêmes actions qu’un recruteur sur les fiches de poste et l’import, mais sa liste, ses détails et toute action portant sur un poste restent limités aux fiches où son contact apparaît dans `gere_poste`.

**Why:** Le CHZ porte un rôle applicatif de recruteur tout en restant territorialement rattaché à ses seuls postes ; appliquer uniquement l’une des deux dimensions crée soit une indisponibilité fonctionnelle, soit un accès transversal indu.

**How to apply:** Autoriser les surfaces recruteur propres aux postes côté interface et API, sans ouvrir les candidats, et vérifier le rattachement côté serveur avant chaque lecture ou mutation ciblant un poste.