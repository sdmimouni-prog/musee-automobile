const defaultConfig = {
  strapiUrl: "http://localhost:1337",
  preferStrapi: true,
  localVehiclesUrl: "assets/dynamic-collection/data/vehicles.json",
  localCategoriesUrl: "assets/dynamic-collection/data/categories.json"
};

const config = { ...defaultConfig, ...(window.CAM_COLLECTION_CONFIG || {}) };

const normalizeAssetUrl = (url) => {
  if (!url) return "";
  if (/^https?:\/\//.test(url)) return url;
  if (url.startsWith("/")) return `${config.strapiUrl}${url}`;
  return url;
};

const field = (item, key) => {
  if (!item) return undefined;
  if (Object.prototype.hasOwnProperty.call(item, key)) return item[key];
  return item.attributes?.[key];
};

const collectionItems = (relation) => {
  if (!relation) return [];
  if (Array.isArray(relation)) return relation;
  if (Array.isArray(relation.data)) return relation.data;
  return [];
};

const singleMedia = (media) => {
  if (!media) return null;
  const data = media.data || media;
  if (!data) return null;
  return data.attributes || data;
};

const normalizeStrapiCategory = (item) => ({
  id: item.documentId || item.id,
  name: field(item, "name"),
  slug: field(item, "slug"),
  type: field(item, "categoryType") || field(item, "type") || "tag",
  sortOrder: field(item, "sortOrder") || 0
});

const normalizeStrapiVehicle = (item) => {
  const media = singleMedia(field(item, "image"));
  const categories = collectionItems(field(item, "categories")).map(normalizeStrapiCategory);
  const categorySlugs = categories.map((category) => category.slug).filter(Boolean);
  const mediaUrl = media?.url ? normalizeAssetUrl(media.url) : "";

  return {
    id: item.documentId || item.id,
    title: field(item, "title"),
    slug: field(item, "slug"),
    sourceFile: field(item, "sourceFile"),
    sourcePdfPage: field(item, "sourcePdfPage"),
    period: field(item, "period"),
    year: field(item, "year"),
    country: field(item, "country"),
    categoryLabel: field(item, "categoryLabel"),
    summary: field(item, "summary"),
    story: field(item, "story"),
    specs: field(item, "specs") || [],
    keywords: field(item, "keywords"),
    legacyImagePath: mediaUrl || field(item, "legacyImagePath"),
    imageUrl: mediaUrl || field(item, "legacyImagePath"),
    isFeatured: Boolean(field(item, "isFeatured")),
    sortOrder: field(item, "sortOrder") || 0,
    categorySlugs,
    categories,
    seo: field(item, "seo")
  };
};

const normalizeLocalVehicle = (vehicle) => ({
  ...vehicle,
  imageUrl: vehicle.legacyImagePath,
  categories: []
});

const loadStrapi = async () => {
  const vehicleQuery = new URLSearchParams({
    "populate[categories]": "*",
    "populate[image]": "*",
    "pagination[pageSize]": "100",
    "sort": "sortOrder:asc",
    "status": "published"
  });
  const categoryQuery = new URLSearchParams({
    "pagination[pageSize]": "100",
    "sort": "sortOrder:asc"
  });

  const [vehiclesResponse, categoriesResponse] = await Promise.all([
    fetch(`${config.strapiUrl}/api/vehicles?${vehicleQuery.toString()}`),
    fetch(`${config.strapiUrl}/api/vehicle-categories?${categoryQuery.toString()}`)
  ]);

  if (!vehiclesResponse.ok || !categoriesResponse.ok) {
    throw new Error("Strapi API unavailable");
  }

  const [vehiclesPayload, categoriesPayload] = await Promise.all([
    vehiclesResponse.json(),
    categoriesResponse.json()
  ]);

  const categories = (categoriesPayload.data || []).map(normalizeStrapiCategory);
  const vehicles = (vehiclesPayload.data || []).map(normalizeStrapiVehicle);

  return { vehicles, categories, source: "Strapi" };
};

const loadLocal = async () => {
  const [vehiclesResponse, categoriesResponse] = await Promise.all([
    fetch(config.localVehiclesUrl),
    fetch(config.localCategoriesUrl)
  ]);

  if (!vehiclesResponse.ok || !categoriesResponse.ok) {
    throw new Error("Local collection data unavailable");
  }

  const [vehicles, categories] = await Promise.all([
    vehiclesResponse.json(),
    categoriesResponse.json()
  ]);

  return {
    vehicles: vehicles.map(normalizeLocalVehicle),
    categories,
    source: "JSON"
  };
};

export const loadCollectionData = async () => {
  if (config.preferStrapi) {
    try {
      const data = await loadStrapi();
      if (data.vehicles.length) return data;
    } catch (error) {
      console.warn(error.message);
    }
  }

  return loadLocal();
};

export const summarizeVehicle = (vehicle) => {
  const category = vehicle.categoryLabel || "Patrimoine";
  const country = vehicle.country || "Origine non renseignée";
  const year = vehicle.year || "Année non renseignée";
  return { category, country, year };
};

export const imageUrl = (vehicle) => vehicle.imageUrl || vehicle.legacyImagePath || "";

export const vehicleHref = (vehicle) => `vehicule.html?slug=${encodeURIComponent(vehicle.slug)}`;

export const textIndex = (vehicle, categories = []) => [
  vehicle.title,
  vehicle.year,
  vehicle.country,
  vehicle.period,
  vehicle.categoryLabel,
  vehicle.summary,
  vehicle.story,
  vehicle.keywords,
  ...(vehicle.categorySlugs || []),
  ...categories.map((category) => category.name)
].filter(Boolean).join(" ").toLowerCase();

export const bySort = (mode) => (a, b) => {
  if (mode === "yearAsc") return (a.year || 9999) - (b.year || 9999);
  if (mode === "yearDesc") return (b.year || 0) - (a.year || 0);
  if (mode === "titleAsc") return String(a.title || "").localeCompare(String(b.title || ""), "fr");
  if (mode === "countryAsc") {
    const country = String(a.country || "").localeCompare(String(b.country || ""), "fr");
    return country || String(a.title || "").localeCompare(String(b.title || ""), "fr");
  }
  return (a.sortOrder || 0) - (b.sortOrder || 0);
};

export const categoryGroups = (categories) => {
  const labels = {
    period: "Période",
    family: "Famille",
    country: "Origine",
    tag: "Autres"
  };

  const grouped = categories.reduce((groups, category) => {
    const type = category.type || category.categoryType || "tag";
    groups[type] ||= [];
    groups[type].push(category);
    return groups;
  }, {});

  return ["period", "family", "country", "tag"]
    .filter((type) => grouped[type]?.length)
    .map((type) => ({
      type,
      label: labels[type],
      categories: grouped[type].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
    }));
};

export const createVehicleCard = (vehicle) => {
  const facts = summarizeVehicle(vehicle);
  const card = document.createElement("article");
  card.className = "vehicle-card";
  card.innerHTML = `
    <a href="${vehicleHref(vehicle)}" aria-label="Voir la fiche ${escapeHtml(vehicle.title)}">
      <img src="${escapeAttribute(imageUrl(vehicle))}" alt="${escapeAttribute(vehicle.title)}" loading="lazy">
      <div class="vehicle-card-body">
        <span class="card-topline">${escapeHtml(facts.year)} · ${escapeHtml(facts.country)}</span>
        <h3>${escapeHtml(vehicle.title)}</h3>
        <p>${escapeHtml(vehicle.summary || "")}</p>
        <div class="vehicle-meta">
          <span>${escapeHtml(facts.category)}</span>
          <span>${escapeHtml(facts.country)}</span>
          <span>${escapeHtml(facts.year)}</span>
        </div>
        <span class="card-action">Découvrir</span>
      </div>
    </a>
  `;
  return card;
};

export const escapeHtml = (value) => String(value ?? "")
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#039;");

export const escapeAttribute = escapeHtml;
