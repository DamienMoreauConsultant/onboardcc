---
name: Polarité de la note Alerte
description: Convention métier des sous-critères et de l’agrégat Alerte du scoring.
---

La note Alerte mesure un danger, contrairement aux notes de compatibilité : 0 signifie OK, 5 Attention et 10 Danger. L’agrégation retient le maximum des trois sous-critères.

**Why:** Zone orange et conditions spartiates sont déclenchées par les caractéristiques du poste, alors que l’hôpital est déclenché par le besoin du candidat. Une compatibilité partielle reste une attention à 5, même lorsque le besoin peut être satisfait.

**How to apply:** Pour Zone orange et Conditions spartiates, un poste non concerné vaut 0 ; sinon l’acceptation du candidat vaut 5 et son refus 10. Pour Hôpital, l’absence de besoin candidat vaut 0 ; si le besoin existe, un hôpital disponible vaut 5 et son absence 10.