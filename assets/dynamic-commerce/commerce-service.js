const defaultConfig = {
  strapiUrl: "http://localhost:1337",
  preferStrapi: true,
  localCommerceUrl: "assets/dynamic-commerce/data/commerce.json"
};

const config = { ...defaultConfig, ...(window.CAM_COMMERCE_CONFIG || {}) };

const field = (item, key) => {
  if (!item) return undefined;
  if (Object.prototype.hasOwnProperty.call(item, key)) return item[key];
  return item.attributes?.[key];
};

const relationItems = (value) => {
  const data = value?.data || value || [];
  return Array.isArray(data) ? data : [];
};

const toNumber = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

const toInteger = (value, fallback = 0) => {
  const number = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(number) ? number : fallback;
};

const todayIso = () => new Date().toISOString().slice(0, 10);

const offsetDate = (offsetDays) => {
  const date = new Date();
  date.setDate(date.getDate() + toInteger(offsetDays, 0));
  return date.toISOString().slice(0, 10);
};

const normalizeDate = (item) => {
  if (field(item, "date")) return field(item, "date");
  if (field(item, "dateOffsetDays") !== undefined) return offsetDate(field(item, "dateOffsetDays"));
  return todayIso();
};

export const audienceLabels = {
  individual: "Visite individuelle",
  family: "Famille & jeunes",
  school: "Visite scolaire éducative",
  corporate: "Groupe corporate",
  garage: "Musée + Le Garage",
  member: "Avantage membre"
};

export const audienceAliases = {
  individuel: "individual",
  famille: "family",
  scolaire: "school",
  corporate: "corporate",
  garage: "garage",
  membre: "member",
  individual: "individual",
  family: "family",
  school: "school",
  member: "member"
};

export const audienceContent = {
  individual: {
    title: "Choisir votre parcours de visite.",
    copy: "Choisissez votre date, votre créneau et préparez votre parcours au sein de la collection Musée."
  },
  family: {
    title: "Famille & jeunes.",
    copy: "Composez une visite plus souple pour parents, jeunes publics et enfants, avec parcours accessible et audioguide famille."
  },
  school: {
    title: "Visite scolaire éducative.",
    copy: "Réservez un créneau pédagogique avec accueil dédié, parcours d'observation, Media Room, ateliers possibles et quiz bilan."
  },
  corporate: {
    title: "Groupe corporate.",
    copy: "Préparez une visite pour équipes, partenaires ou clients, avec créneau maîtrisé et options de privatisation."
  },
  garage: {
    title: "Musée + Le Garage.",
    copy: "Combinez le parcours musée avec une réservation au Garage pour prolonger l'expérience autour d'une table."
  },
  member: {
    title: "Avantage membre.",
    copy: "Accédez au tarif invité membre et préparez une visite prioritaire selon le calendrier Musée."
  }
};

export const menuCategoryLabels = {
  starter: "Entrées",
  main: "Plats",
  dessert: "Desserts",
  drink: "Boissons",
  brunch: "Brunch",
  signature: "Signatures",
  seasonal: "Saison"
};

export const menuCategoryOrder = ["starter", "main", "dessert", "brunch", "drink", "signature", "seasonal"];

export const normalizeAudience = (value) => audienceAliases[value] || value || "individual";

export const money = (value, currency = "Dhs") => `${toNumber(value).toLocaleString("fr-FR")} ${currency}`;

export const escapeHtml = (value) => String(value ?? "")
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#039;");

export const normalizeTicketType = (item) => ({
  id: item.documentId || item.id || field(item, "slug"),
  name: field(item, "name"),
  slug: field(item, "slug"),
  audience: normalizeAudience(field(item, "audience")),
  description: field(item, "description") || "",
  price: toNumber(field(item, "price")),
  currency: field(item, "currency") || "Dhs",
  defaultQuantity: toInteger(field(item, "defaultQuantity"), 0),
  minimumQuantity: toInteger(field(item, "minimumQuantity"), 0),
  maximumQuantity: field(item, "maximumQuantity") === undefined ? null : toInteger(field(item, "maximumQuantity"), 999),
  durationMinutes: toInteger(field(item, "durationMinutes"), 90),
  isActive: field(item, "isActive") !== false,
  sortOrder: toInteger(field(item, "sortOrder"), 0)
});

export const normalizeBookingOption = (item) => ({
  id: item.documentId || item.id || field(item, "slug"),
  name: field(item, "name"),
  slug: field(item, "slug"),
  audience: normalizeAudience(field(item, "audience") || "all"),
  description: field(item, "description") || "",
  price: toNumber(field(item, "price")),
  defaultSelected: Boolean(field(item, "defaultSelected")),
  isActive: field(item, "isActive") !== false,
  sortOrder: toInteger(field(item, "sortOrder"), 0)
});

export const normalizeVisitSlot = (item) => ({
  id: item.documentId || item.id || `${normalizeDate(item)}-${field(item, "startsAt")}`,
  title: field(item, "title"),
  date: normalizeDate(item),
  startsAt: field(item, "startsAt"),
  endsAt: field(item, "endsAt"),
  capacity: toInteger(field(item, "capacity"), 25),
  reservedCount: toInteger(field(item, "reservedCount"), 0),
  status: field(item, "status") || "available",
  audiences: field(item, "audiences") || relationItems(field(item, "ticketTypes")).map((ticket) => normalizeAudience(field(ticket, "audience"))).filter(Boolean)
});

export const normalizeMenuItem = (item) => ({
  id: item.documentId || item.id || field(item, "slug"),
  name: field(item, "name"),
  slug: field(item, "slug"),
  category: field(item, "category") || "main",
  description: field(item, "description") || "",
  price: field(item, "price") === undefined ? null : toNumber(field(item, "price")),
  tags: field(item, "tags") || [],
  isSignature: Boolean(field(item, "isSignature")),
  isActive: field(item, "isActive") !== false,
  sortOrder: toInteger(field(item, "sortOrder"), 0)
});

const activeSorted = (items) => items
  .filter((item) => item.isActive !== false)
  .sort((a, b) => a.sortOrder - b.sortOrder || String(a.name || a.title).localeCompare(String(b.name || b.title)));

const query = (pairs) => {
  const params = new URLSearchParams();
  pairs.forEach(([key, value]) => params.append(key, value));
  return params.toString();
};

const fetchJson = async (endpoint) => {
  const response = await fetch(`${config.strapiUrl}${endpoint}`);
  if (!response.ok) throw new Error(`${endpoint} unavailable`);
  return response.json();
};

const loadStrapi = async () => {
  const ticketQuery = query([
    ["pagination[pageSize]", "100"],
    ["sort[0]", "audience:asc"],
    ["sort[1]", "sortOrder:asc"],
    ["status", "published"]
  ]);
  const optionQuery = query([
    ["pagination[pageSize]", "100"],
    ["sort[0]", "audience:asc"],
    ["sort[1]", "sortOrder:asc"],
    ["status", "published"]
  ]);
  const slotQuery = query([
    ["populate[ticketTypes][fields][0]", "audience"],
    ["pagination[pageSize]", "100"],
    ["sort[0]", "date:asc"],
    ["sort[1]", "startsAt:asc"]
  ]);
  const menuQuery = query([
    ["pagination[pageSize]", "100"],
    ["sort[0]", "category:asc"],
    ["sort[1]", "sortOrder:asc"],
    ["status", "published"]
  ]);

  const [tickets, options, slots, menu] = await Promise.all([
    fetchJson(`/api/ticket-types?${ticketQuery}`),
    fetchJson(`/api/booking-options?${optionQuery}`),
    fetchJson(`/api/visit-slots?${slotQuery}`),
    fetchJson(`/api/restaurant-menu-items?${menuQuery}`)
  ]);

  return {
    ticketTypes: activeSorted((tickets.data || []).map(normalizeTicketType)),
    bookingOptions: activeSorted((options.data || []).map(normalizeBookingOption)),
    visitSlots: (slots.data || []).map(normalizeVisitSlot),
    restaurantMenuItems: activeSorted((menu.data || []).map(normalizeMenuItem)),
    source: "Strapi"
  };
};

const loadLocal = async () => {
  const response = await fetch(config.localCommerceUrl);
  if (!response.ok) throw new Error("Local commerce data unavailable");
  const data = await response.json();

  return {
    ticketTypes: activeSorted((data.ticketTypes || []).map(normalizeTicketType)),
    bookingOptions: activeSorted((data.bookingOptions || []).map(normalizeBookingOption)),
    visitSlots: (data.visitSlots || []).map(normalizeVisitSlot),
    restaurantMenuItems: activeSorted((data.restaurantMenuItems || []).map(normalizeMenuItem)),
    source: "JSON"
  };
};

export const loadCommerceData = async () => {
  if (config.preferStrapi) {
    try {
      const data = await loadStrapi();
      if (data.ticketTypes.length || data.restaurantMenuItems.length) return data;
    } catch (error) {
      console.warn(error.message);
    }
  }

  return loadLocal();
};
