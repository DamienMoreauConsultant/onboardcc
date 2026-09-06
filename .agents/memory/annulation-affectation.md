---
name: Annulation d’affectation
description: Invariants métier à préserver lorsqu’un recruteur annule une affectation.
---

Une annulation d’affectation doit être atomique : l’opportunité ciblée devient « Rejet après affectation » et perd son statut retenu, les opportunités sœurs du candidat ou du poste sont rouvertes, le candidat revient explicitement en ATA et les verrous de mise en lien sont libérés.

**Why:** La réactivation générique des opportunités ne suffit pas à identifier la cible rejetée, à imposer ATA ni à rétablir correctement l’état du poste.

**How to apply:** Exécuter toute l’opération dans une transaction et recalculer le poste en « Pré-réservé » uniquement s’il reste une autre opportunité « Approuvé CM » ; sinon le remettre « À pourvoir ».