# Migration de la collection automobile

Cette migration transforme le fichier source `vehicles.json` du site statique en contenus Strapi:

- `vehicle-category`
- `vehicle`
- images de vehicules dans la media library Strapi, optionnellement

## Source analysee

Fichier source:

```txt
/Users/salaheddinemimouni/Documents/Codex/2026-05-13/files-mentioned-by-the-user-cam/assets/park-auto/vehicles.json
```

Racine media:

```txt
/Users/salaheddinemimouni/Documents/Codex/2026-05-13/files-mentioned-by-the-user-cam
```

Etat du jeu source:

- 69 vehicules
- 13 categories
- 6 pays
- annees de 1878 a 1986
- 0 image manquante
- 0 slug duplique

Rapport genere:

```txt
cms/data/collection/migration-report.json
```

## Donnees generees

Les fichiers normalises sont:

```txt
cms/data/collection/categories.json
cms/data/collection/vehicles.normalized.json
cms/data/collection/migration-report.json
```

`vehicles.normalized.json` est le fichier recommande pour l'import Strapi. Il contient deja:

- champs renommes selon le modele Strapi
- specs converties en composants `{ label, value }`
- `categorySlugs`
- SEO initial
- `legacyImagePath`
- `isFeatured`
- `sortOrder`

## Regenerer les donnees normalisees

Depuis `cms/`:

```sh
npm run prepare:vehicles -- /Users/salaheddinemimouni/Documents/Codex/2026-05-13/files-mentioned-by-the-user-cam/assets/park-auto/vehicles.json data/collection
```

Sans `npm`, le script peut aussi etre lance directement avec Node:

```sh
node scripts/prepare-vehicle-data.mjs /Users/salaheddinemimouni/Documents/Codex/2026-05-13/files-mentioned-by-the-user-cam/assets/park-auto/vehicles.json data/collection
```

## Tester l'import sans Strapi

Le mode `--dry-run` valide les donnees, les chemins d'images et le comportement du script sans appeler l'API Strapi:

```sh
node scripts/import-vehicles.mjs data/collection/vehicles.normalized.json \
  --dry-run \
  --media-root /Users/salaheddinemimouni/Documents/Codex/2026-05-13/files-mentioned-by-the-user-cam \
  --upload-media
```

Resultat attendu:

```txt
Done. Created: 69. Updated: 0. Skipped: 0. Media linked/uploaded: 69.
```

## Importer dans Strapi

Prerequis:

1. PostgreSQL lance.
2. Strapi lance.
3. Admin Strapi cree.
4. API token Strapi cree avec droits de creation/lecture/mise a jour sur:
   - `vehicle`
   - `vehicle-category`
   - upload media

Commande depuis `cms/`:

```sh
STRAPI_API_TOKEN=... npm run import:vehicles -- data/collection/vehicles.normalized.json \
  --media-root /Users/salaheddinemimouni/Documents/Codex/2026-05-13/files-mentioned-by-the-user-cam \
  --upload-media
```

Pour mettre a jour des vehicules deja importes:

```sh
STRAPI_API_TOKEN=... npm run import:vehicles -- data/collection/vehicles.normalized.json \
  --media-root /Users/salaheddinemimouni/Documents/Codex/2026-05-13/files-mentioned-by-the-user-cam \
  --upload-media \
  --update
```

## Strategie d'import

Le script:

1. lit `vehicles.normalized.json`;
2. cree les categories manquantes;
3. verifie chaque vehicule par `slug`;
4. saute les vehicules existants par defaut;
5. met a jour les vehicules existants avec `--update`;
6. upload l'image principale avec `--upload-media`;
7. conserve `legacyImagePath` pour tracer l'origine de chaque image;
8. relie les categories aux vehicules.

## Points a verifier apres import

Dans Strapi Admin:

- 13 entrees dans `Vehicle category`
- 69 entrees dans `Vehicle`
- 69 images principales visibles si `--upload-media` a ete utilise
- quelques vehicules publies pour test frontend
- relations categories visibles sur les vehicules

Dans l'API:

```txt
GET /api/vehicles?populate=categories,image&pagination[pageSize]=3
GET /api/vehicle-categories?sort=sortOrder
GET /api/vehicles?filters[slug][$eq]=benz-patent-motorwagen&populate=*
```

## Limite actuelle

Dans l'environnement Codex actuel, `npm`, Docker et `psql` ne sont pas disponibles dans le PATH. La migration reelle vers une instance Strapi n'a donc pas ete executee ici. En revanche, le pipeline hors Strapi est valide et pret pour execution dans l'environnement de developpement local.
