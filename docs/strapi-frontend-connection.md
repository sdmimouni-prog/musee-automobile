# Connexion Strapi -> collection dynamique

Cette etape fait de Strapi la source de verite de la collection automobile.

## Flux cible

```txt
PostgreSQL -> Strapi -> REST API publique -> frontend/collection.html
```

Le frontend essaie d'abord Strapi sur `http://localhost:1337/api`. Si Strapi n'est pas disponible, il garde un secours JSON local pour ne pas bloquer la demonstration.

## Demarrage

Depuis la racine du projet:

```sh
cp .env.example .env
docker compose up -d postgres
cd cms
npm install
npm run develop
```

Puis ouvrir l'admin Strapi:

```txt
http://localhost:1337/admin
```

## Permissions publiques

Le fichier `cms/src/index.ts` synchronise automatiquement les permissions publiques suivantes au demarrage de Strapi:

- `api::vehicle.vehicle.find`
- `api::vehicle.vehicle.findOne`
- `api::vehicle-category.vehicle-category.find`
- `api::vehicle-category.vehicle-category.findOne`
- `api::news-article.news-article.find`
- `api::news-article.news-article.findOne`
- `api::event.event.find`
- `api::event.event.findOne`
- `api::ticket-type.ticket-type.find`
- `api::ticket-type.ticket-type.findOne`
- `api::booking-option.booking-option.find`
- `api::booking-option.booking-option.findOne`
- `api::visit-slot.visit-slot.find`
- `api::visit-slot.visit-slot.findOne`
- `api::restaurant-menu-item.restaurant-menu-item.find`
- `api::restaurant-menu-item.restaurant-menu-item.findOne`
- `api::booking.booking.create`
- `api::quote-request.quote-request.create`
- `api::restaurant-reservation.restaurant-reservation.create`
- `api::member-request.member-request.create`
- `plugin::upload.content-api.find`
- `plugin::upload.content-api.findOne`

La synchronisation est active par defaut avec:

```txt
BOOTSTRAP_PUBLIC_READ=true
```

Pour la desactiver, passer `BOOTSTRAP_PUBLIC_READ=false`.

## Importer les vehicules

Creer d'abord un API token Strapi avec les droits de creation/mise a jour sur `vehicles`, `vehicle-categories` et `upload`.

Puis lancer l'import depuis `cms`:

```sh
STRAPI_API_TOKEN=... npm run import:vehicles -- data/collection/vehicles.normalized.json --media-root ../frontend --upload-media --update
```

Notes:

- `--upload-media` importe les images dans la bibliotheque media Strapi.
- `--media-root ../frontend` fonctionne parce que les chemins importes ressemblent a `assets/park-auto/...`.
- Sans `--upload-media`, le frontend peut encore utiliser `legacyImagePath`.
- `--update` rend l'import relancable si les vehicules existent deja.

## Importer les contenus editoriaux

Les actualites et evenements de depart sont dans `cms/data/editorial/`.

Pour tester l'import sans modifier Strapi:

```sh
npm run import:editorial -- --dry-run --update
```

Puis, avec un API token autorise sur `news-articles` et `events`:

```sh
STRAPI_API_TOKEN=... npm run import:editorial -- --update
```

## Importer la billetterie et la carte restaurant

Les billets, options, creneaux et plats de depart sont dans `cms/data/commerce/`.

Pour tester l'import sans modifier Strapi:

```sh
npm run import:commerce -- --dry-run --update
```

Puis, avec un API token autorise:

```sh
STRAPI_API_TOKEN=... npm run import:commerce -- --update
```

## Verifier l'API publique

Une fois Strapi lance et l'import termine:

```sh
npm run check:public-api
```

Le controle attend au minimum:

- 69 vehicules
- 13 categories
- 6 actualites
- 6 evenements
- 16 types de billets
- 6 options de reservation
- 7 creneaux de visite
- 15 plats ou boissons
- un titre, un slug, un resume et une image ou un chemin legacy sur le premier vehicule

## Verifier le frontend

Depuis la racine du projet:

```sh
python3 -m http.server 8787 --bind 127.0.0.1
```

Puis ouvrir:

```txt
http://localhost:8787/frontend/collection.html
```

Le compteur de la hero doit afficher `Strapi` comme source active. Si Strapi est eteint ou refuse l'acces, la page retombe sur `JSON`.

Les pages integrees utilisent le meme principe:

```txt
http://localhost:8787/site/collection.html
http://localhost:8787/site/actualites.html
http://localhost:8787/site/agenda.html
http://localhost:8787/site/visite-individuelle.html
http://localhost:8787/site/garage-carte.html
```
