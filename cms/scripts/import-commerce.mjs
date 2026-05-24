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

const commercePath = readFlagValue("--commerce", "data/commerce/commerce.json");

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

const readCommerce = async () => {
  const raw = await fs.readFile(path.resolve(commercePath), "utf8");
  const data = JSON.parse(raw);
  for (const key of ["ticketTypes", "bookingOptions", "visitSlots", "restaurantMenuItems"]) {
    if (!Array.isArray(data[key])) throw new Error(`${commercePath} must contain ${key} array.`);
  }
  return data;
};

const todayOffset = (offsetDays) => {
  const date = new Date();
  date.setDate(date.getDate() + Number.parseInt(String(offsetDays || 0), 10));
  return date.toISOString().slice(0, 10);
};

const dateForSlot = (slot) => slot.date || todayOffset(slot.dateOffsetDays);

const queryString = (pairs) => {
  const params = new URLSearchParams();
  pairs.forEach(([key, value]) => params.append(key, value));
  return params.toString();
};

const getFirstBySlug = async (collection, slug) => {
  if (dryRun) return null;
  const query = queryString([
    ["filters[slug][$eq]", slug],
    ["pagination[pageSize]", "1"],
  ]);
  const payload = await requestJson(`/api/${collection}?${query}`);
  return payload.data?.[0] || null;
};

const getFirstSlot = async (slot) => {
  if (dryRun) return null;
  const query = queryString([
    ["filters[date][$eq]", dateForSlot(slot)],
    ["filters[startsAt][$eq]", slot.startsAt],
    ["filters[title][$eq]", slot.title],
    ["pagination[pageSize]", "1"],
  ]);
  const payload = await requestJson(`/api/visit-slots?${query}`);
  return payload.data?.[0] || null;
};

const documentRef = (item) => item?.documentId || item?.id;

const upsertBySlug = async ({ collection, typeName, item, data }) => {
  if (!item.slug || !item.name) {
    console.warn(`skip invalid ${typeName}`);
    return { result: "skipped", ref: null };
  }

  const existing = await getFirstBySlug(collection, item.slug);
  if (existing && !shouldUpdate) {
    console.log(`skip ${typeName} ${item.slug}`);
    return { result: "skipped", ref: documentRef(existing) };
  }

  if (dryRun) {
    console.log(`${existing ? "dry-run update" : "dry-run create"} ${typeName} ${item.slug}`);
    return { result: existing ? "updated" : "created", ref: item.slug };
  }

  if (existing) {
    const ref = documentRef(existing);
    await requestJson(`/api/${collection}/${ref}`, {
      method: "PUT",
      body: JSON.stringify({ data }),
    });
    console.log(`update ${typeName} ${item.slug}`);
    return { result: "updated", ref };
  }

  const created = await requestJson(`/api/${collection}`, {
    method: "POST",
    body: JSON.stringify({ data }),
  });
  console.log(`create ${typeName} ${item.slug}`);
  return { result: "created", ref: documentRef(created.data) };
};

const upsertSlot = async ({ slot, data }) => {
  const existing = await getFirstSlot(slot);
  const key = `${dateForSlot(slot)} ${slot.startsAt} ${slot.title}`;
  if (existing && !shouldUpdate) {
    console.log(`skip slot ${key}`);
    return "skipped";
  }

  if (dryRun) {
    console.log(`${existing ? "dry-run update" : "dry-run create"} slot ${key}`);
    return existing ? "updated" : "created";
  }

  if (existing) {
    await requestJson(`/api/visit-slots/${documentRef(existing)}`, {
      method: "PUT",
      body: JSON.stringify({ data }),
    });
    console.log(`update slot ${key}`);
    return "updated";
  }

  await requestJson("/api/visit-slots", {
    method: "POST",
    body: JSON.stringify({ data }),
  });
  console.log(`create slot ${key}`);
  return "created";
};

const count = { created: 0, updated: 0, skipped: 0 };
const addResult = (result) => {
  count[result] += 1;
};

const publishedAt = new Date().toISOString();
const commerce = await readCommerce();
const ticketRefsByAudience = new Map();

for (const ticket of commerce.ticketTypes) {
  const { result, ref } = await upsertBySlug({
    collection: "ticket-types",
    typeName: "ticket",
    item: ticket,
    data: {
      name: ticket.name,
      slug: ticket.slug,
      audience: ticket.audience,
      description: ticket.description || null,
      price: ticket.price ?? 0,
      currency: ticket.currency || "Dhs",
      defaultQuantity: ticket.defaultQuantity ?? 0,
      minimumQuantity: ticket.minimumQuantity ?? 0,
      maximumQuantity: ticket.maximumQuantity ?? null,
      durationMinutes: ticket.durationMinutes ?? null,
      isActive: ticket.isActive !== false,
      sortOrder: ticket.sortOrder ?? 0,
      publishedAt,
    },
  });
  addResult(result);
  if (ref) {
    const refs = ticketRefsByAudience.get(ticket.audience) || [];
    refs.push(ref);
    ticketRefsByAudience.set(ticket.audience, refs);
  }
}

for (const option of commerce.bookingOptions) {
  const { result } = await upsertBySlug({
    collection: "booking-options",
    typeName: "option",
    item: option,
    data: {
      name: option.name,
      slug: option.slug,
      audience: option.audience || "all",
      description: option.description || null,
      price: option.price ?? 0,
      defaultSelected: Boolean(option.defaultSelected),
      isActive: option.isActive !== false,
      sortOrder: option.sortOrder ?? 0,
      publishedAt,
    },
  });
  addResult(result);
}

for (const slot of commerce.visitSlots) {
  const ticketTypes = [...new Set((slot.audiences || []).flatMap((audience) => ticketRefsByAudience.get(audience) || []))];
  addResult(await upsertSlot({
    slot,
    data: {
      title: slot.title,
      date: dateForSlot(slot),
      startsAt: slot.startsAt,
      endsAt: slot.endsAt || null,
      capacity: slot.capacity ?? 25,
      reservedCount: slot.reservedCount ?? 0,
      status: slot.status || "available",
      ticketTypes,
    },
  }));
}

for (const item of commerce.restaurantMenuItems) {
  const { result } = await upsertBySlug({
    collection: "restaurant-menu-items",
    typeName: "menu",
    item,
    data: {
      name: item.name,
      slug: item.slug,
      category: item.category,
      description: item.description || null,
      price: item.price ?? null,
      tags: item.tags || [],
      isSignature: Boolean(item.isSignature),
      isActive: item.isActive !== false,
      sortOrder: item.sortOrder ?? 0,
      publishedAt,
    },
  });
  addResult(result);
}

console.log(`Done. Created: ${count.created}. Updated: ${count.updated}. Skipped: ${count.skipped}.`);
