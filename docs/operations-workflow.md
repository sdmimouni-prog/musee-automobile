# Notifications internes et suivi operationnel

Cette etape ajoute une boucle de traitement pour les demandes creees depuis le site.

## Demandes concernees

- `booking`
- `quote-request`
- `restaurant-reservation`
- `member-request`

Chaque nouvelle entree declenche une notification interne via le lifecycle Strapi `afterCreate`.

## Variables de configuration

```txt
INTERNAL_NOTIFICATIONS_ENABLED=true
INTERNAL_NOTIFICATION_TO=operations@museeautomobile.ma
INTERNAL_NOTIFICATION_FROM=no-reply@museeautomobile.ma
INTERNAL_NOTIFICATION_REPLY_TO=contact@museeautomobile.ma
STRAPI_ADMIN_URL=http://localhost:1337

EMAIL_PROVIDER=nodemailer
SMTP_HOST=
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USERNAME=
SMTP_PASSWORD=
```

`INTERNAL_NOTIFICATION_TO` accepte plusieurs destinataires separes par des virgules.

## Statuts de notification

Chaque demande contient:

- `notificationStatus`
  - `pending`
  - `sent`
  - `failed`
  - `skipped`
- `notificationSentAt`
- `notificationError`

Si SMTP n'est pas configure, la demande reste creee dans Strapi et `notificationStatus` passe a `skipped` avec une raison lisible.

## Suivi equipe

Champs communs ajoutes:

- `assignedTo`
- `contactedAt`
- `internalNotes`

Workflow recommande:

1. Ouvrir la collection concernee dans Strapi.
2. Filtrer les demandes `new` ou `pending`.
3. Verifier `notificationStatus`.
4. Renseigner `assignedTo` quand un membre de l'equipe prend la demande.
5. Passer `contactedAt` apres premier appel ou email.
6. Utiliser `internalNotes` pour garder le contexte.
7. Mettre a jour le statut metier:
   - `booking`: `pending`, `confirmed`, `canceled`
   - `quote-request`: `new`, `contacted`, `quoted`, `won`, `lost`
   - `restaurant-reservation`: `new`, `confirmed`, `declined`, `canceled`
   - `member-request`: `new`, `contacted`, `approved`, `declined`

## Fichiers techniques

- `cms/src/utils/internal-notifications.ts`
- `cms/src/api/booking/content-types/booking/lifecycles.ts`
- `cms/src/api/quote-request/content-types/quote-request/lifecycles.ts`
- `cms/src/api/restaurant-reservation/content-types/restaurant-reservation/lifecycles.ts`
- `cms/src/api/member-request/content-types/member-request/lifecycles.ts`

## Export CSV et rapport

Un export operationnel est disponible:

```sh
cd cms
STRAPI_API_TOKEN=... npm run export:operations
```

Il genere dans `cms/exports/operations/<timestamp>/`:

- `all-requests.csv`
- `booking.csv`
- `quote-request.csv`
- `restaurant-reservation.csv`
- `member-request.csv`
- `report.md`

Filtres utiles:

```sh
npm run export:operations -- --status new,pending
npm run export:operations -- --notification-status failed,skipped,pending
npm run export:operations -- --type booking,quote-request
npm run export:operations -- --since 2026-05-01 --until 2026-05-31
```

Pour tester sans Strapi:

```sh
npm run export:operations -- --sample
```
