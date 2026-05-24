# Musee Automobile

This repository contains both the public website and the Strapi CMS for the Musee de l'Automobile du Maroc.

## Structure

- `./` public static website deployed on Vercel
- `cms/` Strapi 5 back-office and API
- `docs/` content model, migration, and deployment notes

## Public Website

The public site is a static HTML/CSS/JavaScript website served from the repository root.

## CMS

The back-office lives in `cms/` and uses Strapi 5 with PostgreSQL.

Basic local setup:

```sh
cp .env.example cms/.env
cd cms
npm install
npm run develop
```

By default, Strapi runs on `http://localhost:1337/admin`.

## Deployment

- Frontend: Vercel
- CMS: Strapi Cloud or another Node/PostgreSQL host
