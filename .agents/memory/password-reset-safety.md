---
name: Sécurité de la réinitialisation de mot de passe
description: Principe durable pour éviter qu’une demande anonyme de réinitialisation puisse verrouiller un compte.
---

Une demande anonyme de mot de passe oublié ne doit jamais remplacer immédiatement le mot de passe. Elle doit seulement émettre un lien expirant et à usage unique, avec limitation persistante des demandes. Pour tout identifiant valide, le code HTTP, le corps JSON et le message affiché doivent rester strictement identiques, que le compte existe ou non et que l’envoi SMTP réussisse ou échoue.

**Why:** Une rotation immédiate permet à toute personne connaissant un identifiant de verrouiller le compte à répétition et de provoquer des envois d’email abusifs. Une réponse différente en cas de compte absent ou d’erreur SMTP permet aussi d’énumérer les comptes.

**How to apply:** Pour tout futur changement du flux, conserver une réponse non discriminante, un jeton court, un secret serveur consommable une seule fois et un délai anti-abus par compte. Journaliser les erreurs SMTP côté serveur avec l’email concerné. Après un échec d’envoi, invalider le nonce sans effacer l’horodatage qui porte le rate limit.