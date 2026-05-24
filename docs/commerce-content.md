# Contenus billetterie et restaurant dynamiques

Cette etape rend pilotables depuis Strapi:

- les types de billets;
- les options de visite;
- les creneaux disponibles;
- la carte du Garage Restaurant.

## Donnees

La source de depart est:

```txt
cms/data/commerce/commerce.json
```

Le fallback frontend equivalent est:

```txt
site/assets/dynamic-commerce/data/commerce.json
```

## Import Strapi

Depuis `cms`, tester sans ecrire:

```sh
npm run import:commerce -- --dry-run --update
```

Puis importer avec un token Strapi autorise:

```sh
STRAPI_API_TOKEN=... npm run import:commerce -- --update
```

Le script importe:

- `ticket-types`
- `booking-options`
- `visit-slots`
- `restaurant-menu-items`

Les creneaux avec `dateOffsetDays` sont convertis en dates reelles au moment de l'import.

## Frontend

Les scripts frontend essaient d'abord Strapi:

```txt
http://localhost:1337/api/ticket-types
http://localhost:1337/api/booking-options
http://localhost:1337/api/visit-slots
http://localhost:1337/api/restaurant-menu-items
```

Si Strapi ne repond pas, ils retombent sur `site/assets/dynamic-commerce/data/commerce.json`.

Pages branchees:

- `site/visite-individuelle.html`
- `site/garage-carte.html`

## Points de vigilance production

- Les prix envoyes par le frontend sont revalides lors de la creation de `booking`.
- Les vrais paiements devront recalculer les montants cote serveur ou via le prestataire de paiement.
- Le rate-limit actuel des formulaires est en memoire Strapi; passer sur Redis/reverse-proxy si plusieurs instances.
