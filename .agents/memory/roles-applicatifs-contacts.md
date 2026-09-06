---
name: Rôles applicatifs et contacts
description: Frontière entre contrôle d’accès générique et rôles métier des contacts.
---

Le RBAC générique utilise exclusivement quatre rôles applicatifs : ADMIN, RECRUTEUR, CM et CANDIDAT. Le rôle contact ADMIN/REC/CHZ/CM1/CM2/CAN reste distinct.

**Why:** Les rôles contact décrivent la fonction métier et les rattachements, alors que plusieurs d’entre eux partagent exactement les mêmes droits applicatifs. Mélanger les deux dimensions a déjà créé des oublis et restrictions incohérentes.

**How to apply:** Utiliser le rôle applicatif dans les gardes de routes, transitions et redirections. Consulter le rôle contact uniquement pour l’affichage ou les règles métier comme `gere_poste`.