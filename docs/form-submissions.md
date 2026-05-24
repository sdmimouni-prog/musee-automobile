# Formulaires publics dynamiques

Cette etape connecte les principaux formulaires visiteurs au CMS Strapi.

## Flux

```txt
Frontend HTML -> assets/dynamic-forms/*.js -> Strapi REST API -> PostgreSQL
```

Si Strapi ne repond pas, les scripts conservent la demande dans le `localStorage` du navigateur sous la cle `cam:pending-submissions`. Cela garde la demonstration fonctionnelle, mais ne remplace pas une vraie persistence serveur.

## Securite ajoutee

Chaque formulaire public ajoute maintenant:

- un champ honeypot invisible `companyWebsite`;
- un horodatage de debut et de fin de soumission;
- un delai minimum configurable avant acceptation serveur;
- une limite de soumissions par IP et par type de formulaire;
- une normalisation serveur des statuts metier.

Variables disponibles:

```txt
PUBLIC_FORM_MIN_ELAPSED_MS=1200
PUBLIC_FORM_RATE_LIMIT_MAX=8
PUBLIC_FORM_RATE_LIMIT_WINDOW_MS=900000
```

La limite de debit actuelle est en memoire dans le processus Strapi. Pour une production multi-instance, la remplacer par un stockage partage type Redis ou par une protection reverse-proxy.

## Pages connectees

- `site/visite-individuelle.html`
  - prepare le brouillon de reservation: date, creneau, billets, options, montant.
- `site/coordonnees.html`
  - cree une entree `booking`.
- `site/demande-devis.html`
  - cree une entree `quote-request`.
- `site/garage-reservation.html`
  - cree une entree `restaurant-reservation`.
- `site/devenir-membre.html`
  - cree une entree `member-request`.

## Permissions Strapi

`cms/src/index.ts` active au demarrage:

- `api::booking.booking.create`
- `api::quote-request.quote-request.create`
- `api::restaurant-reservation.restaurant-reservation.create`
- `api::member-request.member-request.create`

Ces droits permettent uniquement la creation publique. Les validations de `cms/src/utils/public-submission.ts` refusent les soumissions trop rapides, les honeypots remplis, les emails invalides, les dates passees, les quantites incoherentes et les montants de reservation incompatibles avec les lignes de billets.

Les statuts sont forces cote serveur:

- `booking`: `status=pending`, `paymentStatus=unpaid`
- `quote-request`: `status=new`
- `restaurant-reservation`: `status=new`
- `member-request`: `status=new`

Apres creation, les lifecycles Strapi declenchent les notifications internes documentees dans `docs/operations-workflow.md`.

## Verification

Depuis la racine:

```sh
python3 -m http.server 8787 --bind 127.0.0.1
```

Puis tester:

```txt
http://localhost:8787/site/visite-individuelle.html
http://localhost:8787/site/coordonnees.html?type=individuel&amount=200&tickets=1&date=2026-05-20&slot=10h00
http://localhost:8787/site/demande-devis.html
http://localhost:8787/site/garage-reservation.html
http://localhost:8787/site/devenir-membre.html
```

Avec Strapi lance, les soumissions partent vers `http://localhost:1337/api`. Sans Strapi, un message confirme la sauvegarde locale.
