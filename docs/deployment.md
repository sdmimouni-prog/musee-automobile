# Déploiement Strapi + PostgreSQL + frontend

Cette checklist prépare le passage du prototype local vers un environnement exploitable.

## Architecture cible

```txt
Navigateur
  -> Nginx proxy public
    -> frontend statique Nginx
    -> Strapi API/Admin
      -> PostgreSQL
      -> volume uploads Strapi
```

## Fichiers ajoutés

- `.env.production.example`
- `deploy/docker-compose.production.yml`
- `cms/Dockerfile`
- `deploy/frontend.Dockerfile`
- `deploy/nginx/proxy.conf`
- `deploy/nginx/frontend.conf`
- `site/assets/runtime-config.js`
- `deploy/scripts/backup-production.sh`
- `deploy/scripts/restore-production.sh`

## Préparation

1. Copier l'environnement de production:

   ```sh
   cp .env.production.example .env.production
   ```

2. Remplacer tous les secrets:

   - `APP_KEYS`
   - `API_TOKEN_SALT`
   - `ADMIN_JWT_SECRET`
   - `TRANSFER_TOKEN_SALT`
   - `JWT_SECRET`
   - `ENCRYPTION_KEY`
   - `POSTGRES_PASSWORD`
   - `DATABASE_PASSWORD`
   - `SMTP_USERNAME`
   - `SMTP_PASSWORD`

3. Régler les domaines:

   ```txt
   SITE_URL=https://www.museeautomobile.ma
   PUBLIC_URL=https://cms.museeautomobile.ma
   STRAPI_URL=https://cms.museeautomobile.ma
   STRAPI_ADMIN_URL=https://cms.museeautomobile.ma
   CORS_ORIGIN=https://www.museeautomobile.ma,https://museeautomobile.ma,https://cms.museeautomobile.ma
   ```

4. Configurer SMTP ou désactiver temporairement:

   ```txt
   INTERNAL_NOTIFICATIONS_ENABLED=false
   ```

## Configuration frontend

Les pages dynamiques chargent `site/assets/runtime-config.js`.

- en local, l'API Strapi reste sur `http://localhost:1337`;
- en production, l'API est appelée sur le même domaine que le frontend, par exemple `https://www.museeautomobile.ma/api`;
- si le frontend et Strapi sont hébergés sur deux domaines sans proxy `/api`, définir `window.CAM_RUNTIME_STRAPI_URL = "https://cms.museeautomobile.ma"` avant `assets/runtime-config.js`.

## Lancement Docker

Depuis la racine du projet:

```sh
docker compose --env-file .env.production -f deploy/docker-compose.production.yml up -d --build
```

Vérifier:

```sh
docker compose --env-file .env.production -f deploy/docker-compose.production.yml ps
docker compose --env-file .env.production -f deploy/docker-compose.production.yml logs -f strapi
```

## Initialisation Strapi

1. Ouvrir l'admin:

   ```txt
   https://cms.museeautomobile.ma/admin
   ```

2. Créer le premier administrateur.

3. Créer un API token avec droits de création/mise à jour pour les imports.

4. Importer les contenus:

   ```sh
   cd cms
   STRAPI_URL=https://cms.museeautomobile.ma STRAPI_API_TOKEN=... npm run import:vehicles -- data/collection/vehicles.normalized.json --media-root ../site --upload-media --update
   STRAPI_URL=https://cms.museeautomobile.ma STRAPI_API_TOKEN=... npm run import:editorial -- --update
   STRAPI_URL=https://cms.museeautomobile.ma STRAPI_API_TOKEN=... npm run import:commerce -- --update
   ```

5. Vérifier l'API publique:

   ```sh
   STRAPI_URL=https://cms.museeautomobile.ma npm run check:public-api
   ```

## HTTPS

Le fichier `deploy/nginx/proxy.conf` écoute en HTTP pour rester portable.

En production, placer un reverse proxy TLS devant ce conteneur ou adapter Nginx avec Certbot/Let's Encrypt:

- port `80` pour challenge HTTP;
- port `443` avec certificats;
- redirection HTTP -> HTTPS;
- `PUBLIC_URL`, `STRAPI_URL` et `CORS_ORIGIN` doivent rester en HTTPS.

## Médias

Option simple:

- volume Docker `strapi_uploads`;
- sauvegarde régulière avec `deploy/scripts/backup-production.sh`.

Option production avancée:

- provider S3-compatible pour Strapi;
- CDN devant les assets;
- sauvegarde objet côté fournisseur.

## Sauvegardes

Créer une sauvegarde:

```sh
bash deploy/scripts/backup-production.sh
```

Restaurer:

```sh
bash deploy/scripts/restore-production.sh backups/20260519T120000Z
```

À planifier:

- dump PostgreSQL quotidien;
- archive uploads quotidienne;
- conservation 7 quotidiens, 4 hebdomadaires, 6 mensuels;
- test de restauration mensuel.

## Ordre de mise en production

1. Remplir `.env.production`.
2. Lancer PostgreSQL et Strapi.
3. Créer l'admin Strapi.
4. Créer le token d'import.
5. Importer véhicules, éditorial, commerce.
6. Vérifier `check:public-api`.
7. Lancer frontend et proxy.
8. Tester les pages publiques.
9. Tester une soumission formulaire.
10. Vérifier notification email ou statut `notificationStatus`.
11. Activer sauvegardes.
12. Basculer DNS.

## Checklist finale

- [ ] Aucun secret placeholder dans `.env.production`.
- [ ] `PUBLIC_URL` pointe vers l'URL CMS publique.
- [ ] `CORS_ORIGIN` contient le domaine frontend.
- [ ] SMTP testé ou notifications désactivées volontairement.
- [ ] API publique vérifiée.
- [ ] Imports rejouables avec `--update`.
- [ ] Sauvegarde PostgreSQL testée.
- [ ] Sauvegarde uploads testée.
- [ ] HTTPS actif.
- [ ] Formulaires testés.
