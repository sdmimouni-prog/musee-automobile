# CAM Museum CMS

Strapi 5 backend for the museum website.

## Local commands

```sh
cp ../.env.example .env
npm install
npm run develop
```

## PostgreSQL

The project expects the PostgreSQL settings from `cms/.env`:

```txt
DATABASE_CLIENT=postgres
DATABASE_HOST=127.0.0.1
DATABASE_PORT=5432
DATABASE_NAME=cam_museum
DATABASE_USERNAME=cam_museum
DATABASE_PASSWORD=cam_museum
```

## Import

After creating an API token in Strapi:

```sh
STRAPI_API_TOKEN=... npm run import:vehicles -- data/collection/vehicles.normalized.json --media-root ../frontend --upload-media --update
```

The importer keeps the original image path in `legacyImagePath`. With `--upload-media`, it also uploads the images to Strapi's media library.

## Public API check

Once Strapi is running and the import is done:

```sh
npm run check:public-api
```

This checks that the public REST API exposes the expected vehicle and category counts.

## Content model

The editorial model is documented in `../docs/content-model.md`.

## Vehicle migration

The vehicle migration workflow is documented in `../docs/vehicle-migration.md`.

## Frontend connection

The Strapi/frontend connection workflow is documented in `../docs/strapi-frontend-connection.md`.
