import fs from "node:fs/promises";
import path from "node:path";

const strapiUrl = process.env.STRAPI_URL || "http://localhost:1337";
const apiToken = process.env.STRAPI_API_TOKEN;
const args = process.argv.slice(2);

const readFlagValue = (name) => {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
};

const hasFlag = (name) => args.includes(name);

const sourcePath = args.find((arg) => !arg.startsWith("--"));
const mediaRoot = readFlagValue("--media-root") || process.env.VEHICLE_MEDIA_ROOT;
const shouldUploadMedia = hasFlag("--upload-media");
const shouldUpdate = hasFlag("--update");
const dryRun = hasFlag("--dry-run");

if (!sourcePath) {
  console.error("Usage: npm run import:vehicles -- data/collection/vehicles.normalized.json [--media-root /path/to/site] [--upload-media] [--update] [--dry-run]");
  process.exit(1);
}

if (!apiToken && !dryRun) {
  console.error("Missing STRAPI_API_TOKEN. Create a Strapi API token first, then export it.");
  process.exit(1);
}

const jsonHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${apiToken}`,
});

const authHeaders = () => ({
  Authorization: `Bearer ${apiToken}`,
});

const requestJson = async (endpoint, options = {}) => {
  if (dryRun) {
    return { data: null };
  }

  const response = await fetch(`${strapiUrl}${endpoint}`, {
    ...options,
    headers: {
      ...jsonHeaders(),
      ...(options.headers || {}),
    },
  });

  const body = await response.text();
  const payload = body ? JSON.parse(body) : null;

  if (!response.ok) {
    throw new Error(`${options.method || "GET"} ${endpoint} failed (${response.status}): ${body}`);
  }

  return payload;
};

const requestUpload = async (endpoint, formData) => {
  if (dryRun) {
    return [{ id: 1, name: "dry-run-upload" }];
  }

  const response = await fetch(`${strapiUrl}${endpoint}`, {
    method: "POST",
    headers: authHeaders(),
    body: formData,
  });

  const body = await response.text();
  const payload = body ? JSON.parse(body) : null;

  if (!response.ok) {
    throw new Error(`POST ${endpoint} failed (${response.status}): ${body}`);
  }

  return payload;
};

const getFirstBySlug = async (collection, slug) => {
  if (dryRun) return null;
  const query = new URLSearchParams({
    "filters[slug][$eq]": slug,
    "pagination[pageSize]": "1",
  });
  const payload = await requestJson(`/api/${collection}?${query.toString()}`);
  return payload.data?.[0] || null;
};

const getUploadedFileByName = async (name) => {
  if (dryRun) return null;
  const query = new URLSearchParams({
    "filters[name][$eq]": name,
    "pagination[pageSize]": "1",
  });
  const payload = await requestJson(`/api/upload/files?${query.toString()}`);
  return payload?.[0] || null;
};

const categoryNames = {
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

const categoryTypes = {
  "pionnier": "period",
  "avant-guerre": "period",
  "apres-guerre": "period",
  "sport": "family",
  "prestige": "family",
  "populaire": "family",
  "utilitaire": "family",
  "france": "country",
  "allemagne": "country",
  "usa": "country",
  "royaume-uni": "country",
  "italie": "country",
  "suede": "country",
};

const categoryName = (slug) => {
  if (categoryNames[slug]) return categoryNames[slug];
  return slug
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

const ensureCategory = async (slug, index = 0) => {
  const existing = await getFirstBySlug("vehicle-categories", slug);
  if (existing) return existing.documentId || existing.id;

  const data = {
    name: categoryName(slug),
    slug,
    categoryType: categoryTypes[slug] || "tag",
    sortOrder: index + 1,
  };

  if (dryRun) {
    console.log(`dry-run category ${slug}`);
    return slug;
  }

  const created = await requestJson("/api/vehicle-categories", {
    method: "POST",
    body: JSON.stringify({ data }),
  });

  console.log(`category ${slug}`);
  return created.data.documentId || created.data.id;
};

const parseSpec = (spec) => {
  if (typeof spec === "object" && spec?.label && spec?.value) return spec;

  const value = String(spec || "").trim();
  if (!value) return null;

  const [rawLabel, ...rest] = value.split(":");
  if (!rest.length) return { label: "Repère", value };

  return {
    label: rawLabel.trim().replace(/-$/, ""),
    value: rest.join(":").trim(),
  };
};

const toInteger = (value) => {
  const parsed = Number.parseInt(String(value || "").replace(/[^\d-]/g, ""), 10);
  return Number.isFinite(parsed) ? parsed : null;
};

const mimeTypeFor = (filePath) => {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".png") return "image/png";
  if (ext === ".webp") return "image/webp";
  return "image/jpeg";
};

const uploadVehicleImage = async (legacyImagePath) => {
  if (!shouldUploadMedia || !legacyImagePath) return null;
  if (!mediaRoot) {
    throw new Error("--upload-media requires --media-root or VEHICLE_MEDIA_ROOT.");
  }

  const filePath = path.join(mediaRoot, legacyImagePath);
  const fileName = path.basename(filePath);
  const existing = await getUploadedFileByName(fileName);
  if (existing) return existing.id;

  const bytes = await fs.readFile(filePath);
  const formData = new FormData();
  formData.append("files", new Blob([bytes], { type: mimeTypeFor(filePath) }), fileName);

  const uploaded = await requestUpload("/api/upload", formData);
  const firstFile = Array.isArray(uploaded) ? uploaded[0] : uploaded;
  return firstFile?.id ?? null;
};

const normalizeVehicle = (vehicle, index) => {
  const categorySlugs = vehicle.categorySlugs || vehicle.categories || [];

  return {
    title: vehicle.title,
    slug: vehicle.slug,
    sourceFile: vehicle.sourceFile || vehicle.page_file,
    sourcePdfPage: vehicle.sourcePdfPage ?? vehicle.pdf_page ?? null,
    period: vehicle.period || null,
    year: toInteger(vehicle.year),
    country: vehicle.country || null,
    categoryLabel: vehicle.categoryLabel || vehicle.category_label || null,
    summary: vehicle.summary || null,
    story: vehicle.story || null,
    specs: (vehicle.specs || []).map(parseSpec).filter(Boolean),
    keywords: vehicle.keywords || null,
    legacyImagePath: vehicle.legacyImagePath || vehicle.image || null,
    isFeatured: vehicle.isFeatured ?? index < 6,
    sortOrder: vehicle.sortOrder ?? index + 1,
    categorySlugs,
    seo: vehicle.seo || {
      title: `${vehicle.title}${vehicle.year ? ` · ${vehicle.year}` : ""} · Musée de l'Automobile du Maroc`,
      description: vehicle.summary || "",
      keywords: vehicle.keywords || "",
    },
  };
};

const sourceRaw = await fs.readFile(path.resolve(sourcePath), "utf8");
const vehicles = JSON.parse(sourceRaw);

if (!Array.isArray(vehicles)) {
  throw new Error("Expected vehicle source to contain an array.");
}

const normalizedVehicles = vehicles.map(normalizeVehicle);
const uniqueCategorySlugs = [...new Set(normalizedVehicles.flatMap((vehicle) => vehicle.categorySlugs))].sort();

const categoryRefs = new Map();
for (const [index, slug] of uniqueCategorySlugs.entries()) {
  categoryRefs.set(slug, await ensureCategory(slug, index));
}

let createdCount = 0;
let updatedCount = 0;
let skippedCount = 0;
let mediaCount = 0;

for (const [index, vehicle] of normalizedVehicles.entries()) {
  if (!vehicle.slug || !vehicle.title) {
    console.warn(`invalid vehicle entry at index ${index}`);
    skippedCount += 1;
    continue;
  }

  const existing = await getFirstBySlug("vehicles", vehicle.slug);
  if (existing && !shouldUpdate) {
    console.log(`skip ${vehicle.slug}`);
    skippedCount += 1;
    continue;
  }

  const imageId = await uploadVehicleImage(vehicle.legacyImagePath);
  if (imageId) mediaCount += 1;

  const connectedCategories = vehicle.categorySlugs
    .map((slug) => categoryRefs.get(slug))
    .filter(Boolean);

  const data = {
    title: vehicle.title,
    slug: vehicle.slug,
    sourceFile: vehicle.sourceFile,
    sourcePdfPage: vehicle.sourcePdfPage,
    period: vehicle.period,
    year: vehicle.year,
    country: vehicle.country,
    categoryLabel: vehicle.categoryLabel,
    summary: vehicle.summary,
    story: vehicle.story,
    specs: vehicle.specs,
    keywords: vehicle.keywords,
    legacyImagePath: vehicle.legacyImagePath,
    isFeatured: vehicle.isFeatured,
    sortOrder: vehicle.sortOrder,
    seo: vehicle.seo,
    categories: connectedCategories.length ? { connect: connectedCategories } : undefined,
    image: imageId || undefined,
  };

  if (dryRun) {
    console.log(`${existing ? "dry-run update" : "dry-run create"} ${vehicle.slug}`);
    if (existing) updatedCount += 1;
    else createdCount += 1;
    continue;
  }

  if (existing) {
    const documentId = existing.documentId || existing.id;
    await requestJson(`/api/vehicles/${documentId}`, {
      method: "PUT",
      body: JSON.stringify({ data }),
    });
    console.log(`update ${vehicle.slug}`);
    updatedCount += 1;
  } else {
    await requestJson("/api/vehicles", {
      method: "POST",
      body: JSON.stringify({ data }),
    });
    console.log(`create ${vehicle.slug}`);
    createdCount += 1;
  }
}

console.log(`Done. Created: ${createdCount}. Updated: ${updatedCount}. Skipped: ${skippedCount}. Media linked/uploaded: ${mediaCount}.`);
