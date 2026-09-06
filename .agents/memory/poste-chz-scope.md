---
name: Périmètre CHZ sur les postes
description: Règle d’équivalence complète entre les rôles contact CHZ et REC pour le contrôle d’accès.
---

Un CHZ dispose de la même visibilité et de toutes les mêmes actions qu’un recruteur, sur les postes, candidats et opportunités. Son accès ne doit jamais être filtré par `gere_poste`.

**Why:** Les CHZ sont des salariés susceptibles de remplacer les recruteurs et portent donc le rôle applicatif RECRUTEUR. Leur rattachement à un poste reste une information métier, pas une limite d’autorisation.

**How to apply:** Contrôler leurs accès génériques par le rôle applicatif RECRUTEUR. Réserver les filtres `gere_poste` au rôle applicatif CM.