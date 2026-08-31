---
name: Sécurité de la réinitialisation de mot de passe
description: Principe durable pour éviter qu’une demande anonyme de réinitialisation puisse verrouiller un compte.
---

Une demande anonyme de mot de passe oublié ne doit jamais remplacer immédiatement le mot de passe. Elle doit seulement émettre un lien expirant et à usage unique, avec limitation persistante des demandes.

**Why:** Une rotation immédiate permet à toute personne connaissant un identifiant de verrouiller le compte à répétition et de provoquer des envois d’email abusifs.

**How to apply:** Pour tout futur changement du flux, conserver une réponse non discriminante, un jeton court, un secret serveur consommable une seule fois et un délai anti-abus par compte.