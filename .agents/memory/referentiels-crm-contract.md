---
name: Contrat des référentiels CRM
description: Convention d’échange, de stockage et d’affichage des valeurs issues des référentiels DCC.
---

Les fichiers CRM doivent fournir les `crm_key` des référentiels. L’application les résout vers les clés étrangères correspondantes et n’enregistre pas le libellé comme donnée relationnelle. Les écrans affichent toujours la `designation` obtenue par jointure, jamais la `crm_key` technique.

**Why:** Utiliser les libellés comme clés d’échange rend les imports fragiles aux corrections typographiques et aux évolutions éditoriales, tandis qu’afficher les clés techniques dégrade l’expérience utilisateur.

**How to apply:** Pour toute nouvelle colonne référentielle d’un import candidat ou poste, valider la `crm_key`, rejeter la ligne si elle est inconnue, écrire l’identifiant FK et joindre le référentiel pour exposer sa `designation`. Avant de supprimer une ancienne colonne texte, bloquer la migration si une valeur non résolue subsiste.