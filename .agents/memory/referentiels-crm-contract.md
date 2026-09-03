---
name: Contrat des référentiels CRM
description: Convention d’échange, de stockage et d’affichage des valeurs issues des référentiels DCC.
---

Les fichiers CRM doivent fournir les `crm_key` des référentiels. L’application les résout vers les clés étrangères correspondantes et n’enregistre pas le libellé comme donnée relationnelle. Les écrans affichent toujours la `designation` obtenue par jointure, jamais la `crm_key` technique.

Les contacts CM1, CM2, CHZ, MIS et PAR liés aux postes constituent une exception : le CRM est maître de ces contacts et l’import les crée ou les met à jour par `crm_key`. Un contact inconnu ne doit donc pas être rejeté, afin qu’un même contact conserve une identité unique et les mêmes rattachements RBAC sur tous ses postes.

L’import Candidat a la frontière inverse : le site web ne crée un dossier qu’une seule fois. Dès que son `web_key` existe, l’import doit le rejeter et les corrections appartiennent exclusivement aux écrans Recruteur, afin de ne jamais écraser le travail manuel.

**Why:** Utiliser les libellés comme clés d’échange rend les imports fragiles aux corrections typographiques et aux évolutions éditoriales, tandis qu’afficher les clés techniques dégrade l’expérience utilisateur.

**How to apply:** Pour une colonne de référentiel, valider la `crm_key`, rejeter la ligne si elle est inconnue, écrire l’identifiant FK et joindre le référentiel pour exposer sa `designation`. Pour les cinq groupes de contacts Poste, faire un upsert par `crm_key`, réappliquer le rôle du groupe et mettre à jour l’adresse structurée existante en place.