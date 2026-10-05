# AJI Collab — intégration Vercel / Airtable / GitHub

## Architecture
- GitHub: source et historique, branche `integration/aji-collab-cloud`.
- Vercel: hébergement statique + fonctions `/api/*` + sessions HttpOnly signées.
- Airtable: source de vérité utilisateurs, rôles, audit et snapshots métier versionnés.

## Variables Vercel
Déjà créées: `SESSION_SECRET`, `AIRTABLE_BASE_ID`, `AIRTABLE_*_TABLE_ID`.
À fournir manuellement dans Vercel: `AIRTABLE_TOKEN` (type Sensitive) avec accès à la base `AJI Collab — Production`.

Le token Airtable ne doit jamais être placé dans le HTML, GitHub ou une variable publique.

## Données
La synchronisation métier est volontairement explicite dans l’écran Données:
- Vérifier le cloud
- Charger état cloud
- Publier cet état

Le serveur applique un numéro de révision. Une publication depuis une révision périmée est refusée (HTTP 409).
Les snapshots sont gzip + base64, découpés en chunks Airtable. Le pointeur de révision n’est modifié qu’après écriture complète des chunks.

## Limite connue
Le mode Cloud ne remplace pas automatiquement l’état local. C’est volontaire pour éviter toute perte silencieuse lors de la première migration.
