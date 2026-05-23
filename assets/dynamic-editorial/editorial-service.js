const defaultConfig = {
  strapiUrl: "http://localhost:1337",
  preferStrapi: true,
  localNewsUrl: "assets/dynamic-editorial/data/news.json",
  localEventsUrl: "assets/dynamic-editorial/data/events.json"
};

const config = { ...defaultConfig, ...(window.CAM_EDITORIAL_CONFIG || {}) };

const field = (item, key) => {
  if (!item) return undefined;
  if (Object.prototype.hasOwnProperty.call(item, key)) return item[key];
  return item.attributes?.[key];
};

const singleMedia = (media) => {
  if (!media) return null;
  const data = media.data || media;
  return data?.attributes || data || null;
};

const normalizeAssetUrl = (url) => {
  if (!url) return "";
  if (/^https?:\/\//.test(url)) return url;
  if (url.startsWith("/")) return `${config.strapiUrl}${url}`;
  return url;
};

const plainText = (value) => {
  if (!Array.isArray(value)) return String(value || "");
  return value
    .map((block) => (block.children || []).map((child) => child.text || "").join(""))
    .filter(Boolean)
    .join("\n\n");
};

const coverUrl = (item, mediaKey = "coverImage", fallbackKey = "coverImagePath") => {
  const media = singleMedia(field(item, mediaKey));
  return normalizeAssetUrl(media?.url || field(item, fallbackKey) || "");
};

export const newsCategoryLabels = {
  news: "Actualité",
  press: "Communiqué",
  media: "Média",
  community: "Communauté"
};

export const eventStatusLabels = {
  planned: "À venir",
  current: "En cours",
  past: "Passé",
  canceled: "Annulé"
};

export const normalizeNewsArticle = (item) => ({
  id: item.documentId || item.id || field(item, "slug"),
  title: field(item, "title"),
  slug: field(item, "slug"),
  category: field(item, "category") || "news",
  excerpt: field(item, "excerpt") || "",
  body: plainText(field(item, "body")),
  author: field(item, "author") || "Musée de l'Automobile du Maroc",
  publishedDate: field(item, "publishedDate"),
  isFeatured: Boolean(field(item, "isFeatured")),
  coverImagePath: field(item, "coverImagePath"),
  coverImageUrl: coverUrl(item),
  seo: field(item, "seo")
});

export const normalizeEvent = (item) => ({
  id: item.documentId || item.id || field(item, "slug"),
  title: field(item, "title"),
  slug: field(item, "slug"),
  status: field(item, "status") || "planned",
  startDate: field(item, "startDate"),
  endDate: field(item, "endDate"),
  venue: field(item, "venue") || "Musée de l'Automobile du Maroc",
  excerpt: field(item, "excerpt") || "",
  description: plainText(field(item, "description")),
  bookingUrl: field(item, "bookingUrl") || "tickets.html",
  tags: field(item, "tags") || [],
  coverImagePath: field(item, "coverImagePath"),
  coverImageUrl: coverUrl(item),
  seo: field(item, "seo")
});

const loadStrapi = async () => {
  const newsQuery = new URLSearchParams({
    "populate[coverImage]": "*",
    "pagination[pageSize]": "50",
    "sort": "publishedDate:desc",
    "status": "published"
  });

  const eventQuery = new URLSearchParams({
    "populate[coverImage]": "*",
    "pagination[pageSize]": "50",
    "sort": "startDate:asc",
    "status": "published"
  });

  const [newsResponse, eventsResponse] = await Promise.all([
    fetch(`${config.strapiUrl}/api/news-articles?${newsQuery.toString()}`),
    fetch(`${config.strapiUrl}/api/events?${eventQuery.toString()}`)
  ]);

  if (!newsResponse.ok || !eventsResponse.ok) {
    throw new Error("Strapi editorial API unavailable");
  }

  const [newsPayload, eventsPayload] = await Promise.all([
    newsResponse.json(),
    eventsResponse.json()
  ]);

  return {
    news: (newsPayload.data || []).map(normalizeNewsArticle),
    events: (eventsPayload.data || []).map(normalizeEvent),
    source: "Strapi"
  };
};

const loadLocal = async () => {
  const [newsResponse, eventsResponse] = await Promise.all([
    fetch(config.localNewsUrl),
    fetch(config.localEventsUrl)
  ]);

  if (!newsResponse.ok || !eventsResponse.ok) {
    throw new Error("Local editorial data unavailable");
  }

  const [news, events] = await Promise.all([
    newsResponse.json(),
    eventsResponse.json()
  ]);

  return {
    news: news.map(normalizeNewsArticle),
    events: events.map(normalizeEvent),
    source: "JSON"
  };
};

export const loadEditorialData = async () => {
  if (config.preferStrapi) {
    try {
      const data = await loadStrapi();
      if (data.news.length || data.events.length) return data;
    } catch (error) {
      console.warn(error.message);
    }
  }

  return loadLocal();
};

export const formatDate = (value, options = {}) => {
  if (!value) return "Date à confirmer";
  const formatterOptions = {
    day: "2-digit",
    month: "short"
  };

  if (options.withYear) formatterOptions.year = "numeric";
  if (options.withTime) {
    formatterOptions.hour = "2-digit";
    formatterOptions.minute = "2-digit";
  }

  return new Intl.DateTimeFormat("fr-FR", formatterOptions).format(new Date(value)).replace(".", "");
};

export const dayNumber = (value) => {
  if (!value) return "--";
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit" }).format(new Date(value));
};

export const monthTime = (value) => {
  if (!value) return "Date à confirmer";
  return new Intl.DateTimeFormat("fr-FR", {
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value)).replace(".", "");
};

export const imageUrl = (item) => item.coverImageUrl || item.coverImagePath || "";

export const newsHref = (article) => `communique-detail.html?slug=${encodeURIComponent(article.slug)}`;

export const eventHref = (event) => `detail-evenement.html?slug=${encodeURIComponent(event.slug)}`;

export const escapeHtml = (value) => String(value ?? "")
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#039;");

export const escapeAttribute = escapeHtml;
