# Modele de contenus Strapi

Ce document decrit le modele editorial cible du site dynamique du Musee de l'Automobile du Maroc.

## Principes

- Les contenus publics doivent etre administrables dans Strapi sans modification du code.
- Les donnees de collection automobile restent structurees pour permettre recherche, filtres, tri et fiches dynamiques.
- Les demandes visiteurs sont stockees comme contenus operationnels: reservations, devis, demandes membre.
- Les textes generiques de pages sont geres par `page`, mais les domaines metier importants ont leurs propres collections.

## Parametres globaux

### `site-setting`

Single type pour les donnees partagees par tout le site.

Champs principaux:

- `siteName`
- `tagline`
- `defaultLocale`
- `museumOpeningHours`
- `garageOpeningHours`
- `contacts`
- `socialLinks`
- `logo`
- `favicon`
- `seo`

Utilisation frontend:

- header
- footer
- contacts
- horaires
- SEO par defaut

## Navigation

### `navigation-item`

Collection pour construire les menus desktop, mobile et footer.

Champs principaux:

- `label`
- `url`
- `description`
- `menuGroup`
- `isExternal`
- `isHighlighted`
- `isActive`
- `sortOrder`
- `parent`
- `children`

Utilisation frontend:

- menu principal
- mega menus
- menu mobile
- footer
- liens legaux

## Collection automobile

### `vehicle`

Collection coeur du musee.

Champs principaux:

- `title`
- `slug`
- `year`
- `period`
- `country`
- `categoryLabel`
- `summary`
- `story`
- `specs`
- `keywords`
- `image`
- `gallery`
- `legacyImagePath`
- `sourceFile`
- `sourcePdfPage`
- `isFeatured`
- `sortOrder`
- `seo`
- `categories`

Utilisation frontend:

- grille collection
- recherche
- filtres
- fiches vehicules
- vehicules mis en avant

### `vehicle-category`

Categories et tags structurants.

Exemples:

- Pionnier
- Avant-guerre
- Apres-guerre
- Sport & GT
- Prestige
- Populaire
- Utilitaire
- France
- Allemagne
- USA

## Pages editoriales

### `page`

Collection pour pages administrables.

Champs principaux:

- `title`
- `slug`
- `pageType`
- `navigationLabel`
- `subtitle`
- `hero`
- `body`
- `blocks`
- `heroImage`
- `isHomepage`
- `sortOrder`
- `seo`

`blocks` accepte:

- `page.rich-section`
- `page.card-grid`

Utilisation frontend:

- pages institutionnelles
- pages legales
- pages de presentation
- contenus de support non metier

## Actualites et agenda

### `news-article`

Articles, communiques, presse et contenus communautaires.

Champs principaux:

- `title`
- `slug`
- `category`
- `excerpt`
- `body`
- `author`
- `coverImage`
- `coverImagePath`
- `gallery`
- `publishedDate`
- `isFeatured`
- `seo`

### `event`

Evenements musee, expositions temporaires, Cars & Coffee, programmation.

Champs principaux:

- `title`
- `slug`
- `status`
- `startDate`
- `endDate`
- `venue`
- `venueSpaces`
- `excerpt`
- `description`
- `coverImage`
- `coverImagePath`
- `gallery`
- `bookingUrl`
- `tags`
- `seo`

## Billetterie

### `ticket-type`

Produits de billetterie.

Champs principaux:

- `name`
- `slug`
- `audience`
- `description`
- `price`
- `currency`
- `defaultQuantity`
- `minimumQuantity`
- `maximumQuantity`
- `durationMinutes`
- `options`
- `visitSlots`
- `isActive`
- `sortOrder`

### `booking-option`

Options additionnelles.

Exemples:

- Audioguide
- Parcours express
- Parcours complet
- Table au Garage
- Guide prive

Champs principaux:

- `name`
- `slug`
- `audience`
- `description`
- `price`
- `defaultSelected`
- `ticketTypes`
- `isActive`
- `sortOrder`

### `visit-slot`

Creneaux disponibles.

Champs principaux:

- `title`
- `date`
- `startsAt`
- `endsAt`
- `capacity`
- `reservedCount`
- `status`
- `ticketTypes`

### `booking`

Reservations visiteurs.

Champs principaux:

- `reference`
- `ticketType`
- `slot`
- `bookingOptions`
- `visitDate`
- `visitSlot`
- `customerName`
- `email`
- `phone`
- `ticketCount`
- `lineItems`
- `amount`
- `options`
- `status`
- `paymentStatus`
- `notes`
- `assignedTo`
- `contactedAt`
- `internalNotes`
- `notificationStatus`
- `notificationSentAt`
- `notificationError`
- `source`
- `locale`

## Evenementiel

### `venue-space`

Espaces disponibles pour privatisation ou evenements.

Champs principaux:

- `name`
- `slug`
- `spaceType`
- `capacityStanding`
- `capacitySeated`
- `description`
- `features`
- `coverImage`
- `gallery`
- `isFeatured`
- `sortOrder`

### `quote-request`

Demandes de devis.

Champs principaux:

- `name`
- `email`
- `phone`
- `eventType`
- `guestCount`
- `desiredDate`
- `message`
- `status`
- `assignedTo`
- `contactedAt`
- `internalNotes`
- `notificationStatus`
- `notificationSentAt`
- `notificationError`

## Le Garage

### `restaurant-menu-item`

Carte du restaurant.

Champs principaux:

- `name`
- `slug`
- `category`
- `description`
- `price`
- `image`
- `tags`
- `isSignature`
- `isActive`
- `sortOrder`

### `restaurant-reservation`

Demandes de reservation table.

Champs principaux:

- `name`
- `email`
- `phone`
- `guestCount`
- `reservationDate`
- `slot`
- `message`
- `status`
- `assignedTo`
- `contactedAt`
- `internalNotes`
- `notificationStatus`
- `notificationSentAt`
- `notificationError`

## Membres

### `member-request`

Demandes d'adhesion.

Champs principaux:

- `name`
- `email`
- `phone`
- `membershipType`
- `message`
- `status`
- `assignedTo`
- `contactedAt`
- `internalNotes`
- `notificationStatus`
- `notificationSentAt`
- `notificationError`

## Medias

### `media-gallery`

Galeries photos, videos et ressources presse.

Champs principaux:

- `title`
- `slug`
- `description`
- `assets`
- `sortOrder`
- `seo`

## Composants reutilisables

### `seo.meta`

- `title`
- `description`
- `keywords`
- `image`

### `vehicle.spec`

- `label`
- `value`

### `shared.link`

- `label`
- `url`
- `description`
- `isExternal`

### `shared.opening-hour`

- `dayLabel`
- `opensAt`
- `closesAt`
- `isClosed`
- `note`

### `shared.contact-channel`

- `label`
- `type`
- `value`
- `url`

### `page.hero`

- `eyebrow`
- `title`
- `copy`
- `image`
- `primaryCta`
- `secondaryCta`
- `stats`

### `page.rich-section`

- `eyebrow`
- `title`
- `body`
- `image`
- `cta`

### `page.card-grid`

- `eyebrow`
- `title`
- `copy`
- `cards`

## Priorite d'alimentation

1. `vehicle-category`
2. `vehicle`
3. `site-setting`
4. `navigation-item`
5. `ticket-type`, `booking-option`, `visit-slot`
6. `venue-space`
7. `restaurant-menu-item`
8. `page`, `news-article`, `event`
9. formulaires operationnels au fil des demandes
