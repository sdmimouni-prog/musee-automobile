import fs from "node:fs/promises";
import path from "node:path";

const sourcePath = process.argv[2];
const outputDir = process.argv[3] || "data/collection";

if (!sourcePath) {
  console.error("Usage: node scripts/prepare-vehicle-data.mjs /path/to/vehicles.json [output-dir]");
  process.exit(1);
}

const categoryLabels = {
  "pionnier": "Pionnier",
  "avant-guerre": "Avant-guerre",
  "apres-guerre": "Après-guerre",
  "sport": "Sport & GT",
  "prestige": "Prestige",
  "populaire": "Populaire",
  "utilitaire": "Utilitaire",
  "france": "France",
  "allemagne": "Allemagne",
  "usa": "USA",
  "royaume-uni": "Royaume-Uni",
  "italie": "Italie",
  "suede": "Suède",
};

const categoryType = (slug) => {
  if (["france", "allemagne", "usa", "royaume-uni", "italie", "suede"].includes(slug)) return "country";
  if (["pionnier", "avant-guerre", "apres-guerre"].includes(slug)) return "period";
  return "family";
};

const parseSpec = (spec) => {
  const value = String(spec || "").trim();
  if (!value) return null;

  const [rawLabel, ...rest] = value.split(":");
  if (!rest.length) {
    return { label: "Repère", value };
  }

  return {
    label: rawLabel.trim().replace(/-$/, ""),
    value: rest.join(":").trim(),
  };
};

const toInteger = (value) => {
  const parsed = Number.parseInt(String(value || "").replace(/[^\d-]/g, ""), 10);
  return Number.isFinite(parsed) ? parsed : null;
};

const normalizeVehicle = (vehicle, index) => ({
  title: vehicle.title,
  slug: vehicle.slug,
  sourceFile: vehicle.page_file,
  sourcePdfPage: vehicle.pdf_page ?? null,
  period: vehicle.period || null,
  year: toInteger(vehicle.year),
  country: vehicle.country || null,
  categoryLabel: vehicle.category_label || null,
  summary: vehicle.summary || null,
  story: vehicle.story || null,
  specs: (vehicle.specs || []).map(parseSpec).filter(Boolean),
  keywords: vehicle.keywords || null,
  legacyImagePath: vehicle.image || null,
  isFeatured: index < 6,
  sortOrder: index + 1,
  categorySlugs: vehicle.categories || [],
  seo: {
    title: `${vehicle.title}${vehicle.year ? ` · ${vehicle.year}` : ""} · Musée de l'Automobile du Maroc`,
    description: vehicle.summary || "",
    keywords: vehicle.keywords || "",
  },
});

const resolvedSource = path.resolve(sourcePath);
const projectRoot = path.resolve(path.dirname(resolvedSource), "../..");
const vehicles = JSON.parse(await fs.readFile(resolvedSource, "utf8"));

if (!Array.isArray(vehicles)) {
  throw new Error("Expected vehicles.json to contain an array.");
}

const slugs = new Set();
const duplicates = [];
const missingImages = [];

for (const vehicle of vehicles) {
  if (slugs.has(vehicle.slug)) duplicates.push(vehicle.slug);
  slugs.add(vehicle.slug);

  if (!vehicle.image) {
    missingImages.push({ slug: vehicle.slug, image: vehicle.image });
    continue;
  }

  try {
    await fs.access(path.join(projectRoot, vehicle.image));
  } catch {
    missingImages.push({ slug: vehicle.slug, image: vehicle.image });
  }
}

const categories = [...new Set(vehicles.flatMap((vehicle) => vehicle.categories || []))]
  .sort()
  .map((slug, index) => ({
    name: categoryLabels[slug] || slug,
    slug,
    type: categoryType(slug),
    sortOrder: index + 1,
  }));

const normalizedVehicles = vehicles.map(normalizeVehicle);
const countries = [...new Set(normalizedVehicles.map((vehicle) => vehicle.country).filter(Boolean))].sort();
const years = normalizedVehicles.map((vehicle) => vehicle.year).filter(Number.isFinite);

const report = {
  source: resolvedSource,
  mediaRoot: projectRoot,
  generatedAt: new Date().toISOString(),
  vehicles: normalizedVehicles.length,
  categories: categories.length,
  countries,
  yearRange: {
    min: Math.min(...years),
    max: Math.max(...years),
  },
  missingImages,
  duplicateSlugs: duplicates,
  readyForImport: missingImages.length === 0 && duplicates.length === 0,
};

await fs.mkdir(outputDir, { recursive: true });
await fs.writeFile(path.join(outputDir, "categories.json"), `${JSON.stringify(categories, null, 2)}\n`);
await fs.writeFile(path.join(outputDir, "vehicles.normalized.json"), `${JSON.stringify(normalizedVehicles, null, 2)}\n`);
await fs.writeFile(path.join(outputDir, "migration-report.json"), `${JSON.stringify(report, null, 2)}\n`);

console.log(JSON.stringify(report, null, 2));
