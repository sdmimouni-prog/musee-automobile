import fs from "node:fs/promises";
import path from "node:path";

const strapiUrl = (process.env.STRAPI_URL || "http://localhost:1337").replace(/\/$/, "");
const apiToken = process.env.STRAPI_API_TOKEN;
const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const shouldUpdate = args.includes("--update");

const readFlagValue = (name, fallback) => {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : fallback;
};

const newsPath = readFlagValue("--news", "data/editorial/news.json");
const eventsPath = readFlagValue("--events", "data/editorial/events.json");

if (!apiToken && !dryRun) {
  console.error("Missing STRAPI_API_TOKEN. Create a Strapi API token first, then export it.");
  process.exit(1);
}

const headers = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${apiToken}`,
});

const requestJson = async (endpoint, options = {}) => {
  if (dryRun) return { data: null };

  const response = await fetch(`${strapiUrl}${endpoint}`, {
    ...options,
    headers: {
      ...headers(),
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

const getFirstBySlug = async (collection, slug) => {
  if (dryRun) return null;
  const query = new URLSearchParams({
    "filters[slug][$eq]": slug,
    "pagination[pageSize]": "1",
  });
  const payload = await requestJson(`/api/${collection}?${query.toString()}`);
  return payload.data?.[0] || null;
};

const readJson = async (filePath) => {
  const raw = await fs.readFile(path.resolve(filePath), "utf8");
  const data = JSON.parse(raw);
  if (!Array.isArray(data)) throw new Error(`${filePath} should contain an array.`);
  return data;
};

const upsert = async ({ collection, typeName, item, data }) => {
  if (!item.slug || !item.title) {
    console.warn(`skip invalid ${typeName}`);
    return "skipped";
  }

  const existing = await getFirstBySlug(collection, item.slug);
  if (existing && !shouldUpdate) {
    console.log(`skip ${typeName} ${item.slug}`);
    return "skipped";
  }

  if (dryRun) {
    console.log(`${existing ? "dry-run update" : "dry-run create"} ${typeName} ${item.slug}`);
    return existing ? "updated" : "created";
  }

  if (existing) {
    const documentId = existing.documentId || existing.id;
    await requestJson(`/api/${collection}/${documentId}`, {
      method: "PUT",
      body: JSON.stringify({ data }),
    });
    console.log(`update ${typeName} ${item.slug}`);
    return "updated";
  }

  await requestJson(`/api/${collection}`, {
    method: "POST",
    body: JSON.stringify({ data }),
  });
  console.log(`create ${typeName} ${item.slug}`);
  return "created";
};

const count = { created: 0, updated: 0, skipped: 0 };
const addResult = (result) => {
  count[result] += 1;
};

const news = await readJson(newsPath);
for (const article of news) {
  addResult(await upsert({
    collection: "news-articles",
    typeName: "news",
    item: article,
    data: {
      title: article.title,
      slug: article.slug,
      category: article.category || "news",
      excerpt: article.excerpt || null,
      body: article.body || null,
      author: article.author || null,
      publishedDate: article.publishedDate || null,
      isFeatured: Boolean(article.isFeatured),
      coverImagePath: article.coverImagePath || null,
      seo: article.seo || {
        title: `${article.title} · Musée de l'Automobile du Maroc`,
        description: article.excerpt || "",
      },
    },
  }));
}

const events = await readJson(eventsPath);
for (const event of events) {
  addResult(await upsert({
    collection: "events",
    typeName: "event",
    item: event,
    data: {
      title: event.title,
      slug: event.slug,
      status: event.status || "planned",
      startDate: event.startDate || null,
      endDate: event.endDate || null,
      venue: event.venue || null,
      excerpt: event.excerpt || null,
      description: event.description || null,
      coverImagePath: event.coverImagePath || null,
      tags: event.tags || [],
      bookingUrl: event.bookingUrl || null,
      seo: event.seo || {
        title: `${event.title} · Musée de l'Automobile du Maroc`,
        description: event.excerpt || "",
      },
    },
  }));
}

console.log(`Done. Created: ${count.created}. Updated: ${count.updated}. Skipped: ${count.skipped}.`);
