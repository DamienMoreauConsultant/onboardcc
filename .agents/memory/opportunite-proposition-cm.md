---
name: Historique de proposition au CM
description: Distinction entre proposition courante et proposition historique d’une opportunité.
---

Pour les tableaux CM, utiliser l’état « Proposée au CM » pour les opportunités actuellement à approuver, et le flag persistant de proposition pour l’historique, y compris après approbation ou rejet.

**Why:** L’état évolue après le traitement du CM, tandis que le flag posé lors de la proposition n’est pas remis à faux. Il constitue donc la seule trace durable existante de cette étape.

**How to apply:** Distinguer systématiquement les filtres « courant » et « déjà proposé » ; ne pas déduire l’historique de l’état actuel ni de l’historique candidat.