---
name: Dates d’import des postes
description: Contrat de format et règle de conversion des dates provenant du CRM.
---

Les dates reçues par l’import des postes suivent strictement le format français `JJ/MM/AAAA`. Elles doivent être validées calendriquement puis converties en `AAAA-MM-JJ` avant toute requête PostgreSQL.

**Why:** PostgreSQL peut interpréter une date française ambiguë selon son `datestyle` et rejeter l’import au moment de l’écriture, après une vérification pourtant réussie.

**How to apply:** Réutiliser la même fonction de conversion dans les endpoints de vérification et d’exécution, et signaler l’erreur avec le numéro de ligne avant toute écriture transactionnelle.