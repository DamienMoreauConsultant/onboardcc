---
name: Frontière import Poste et scoring
description: Séparation entre l’écriture des données maîtres CRM et la décision de recalcul des opportunités.
---

L’import Poste traite le CRM comme référentiel maître : un `crm_key` existant déclenche un UPDATE non comparatif des données importées, y compris les valeurs vides et `date_maj_crm`. Il ne modifie aucun flag pour demander un recalcul.

**Why:** La décision de recalcul appartient exclusivement au module de scoring, qui compare de façon autonome `date_maj_crm` à la date du dernier recalcul. Dupliquer cette décision dans l’import créerait deux logiques susceptibles de diverger.

**How to apply:** Toute évolution de l’import Poste doit rester limitée à la validation, la résolution des référentiels et l’écriture des données CRM. Ne pas y ajouter de comparaison de dates ni de flag de recalcul.