# Politique de sécurité — AJI HUB

Ce dépôt est public et son contenu peut être servi directement par GitHub Pages.

## Règles

- Aucun secret, token, mot de passe, cookie ou identifiant privé dans ce dépôt.
- Aucune donnée métier réelle ou personnelle dans les fichiers HTML/JavaScript.
- Toute valeur provenant d'un utilisateur ou de `localStorage` doit être traitée comme non fiable avant insertion dans le DOM.
- Les URL configurables doivent être validées avant navigation et limitées aux protocoles attendus.
- Les liens ouverts dans un nouvel onglet doivent éviter de laisser une relation exploitable avec la page d'origine.

## Publication

Une modification du frontend doit être testée localement avant fusion dans `main`, car `main` peut alimenter l'instance publiée via GitHub Pages.
