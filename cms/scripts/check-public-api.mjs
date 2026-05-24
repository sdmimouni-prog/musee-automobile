const strapiUrl = (process.env.STRAPI_URL || "http://localhost:1337").replace(/\/$/, "");
const expectedVehicles = Number.parseInt(process.env.EXPECTED_VEHICLE_COUNT || "69", 10);
const expectedCategories = Number.parseInt(process.env.EXPECTED_CATEGORY_COUNT || "13", 10);
const expectedNews = Number.parseInt(process.env.EXPECTED_NEWS_COUNT || "6", 10);
const expectedEvents = Number.parseInt(process.env.EXPECTED_EVENT_COUNT || "6", 10);
const expectedTicketTypes = Number.parseInt(process.env.EXPECTED_TICKET_TYPE_COUNT || "16", 10);
const expectedBookingOptions = Number.parseInt(process.env.EXPECTED_BOOKING_OPTION_COUNT || "6", 10);
const expectedVisitSlots = Number.parseInt(process.env.EXPECTED_VISIT_SLOT_COUNT || "7", 10);
const expectedMenuItems = Number.parseInt(process.env.EXPECTED_MENU_ITEM_COUNT || "15", 10);

const vehicleQuery = new URLSearchParams({
  "populate[categories]": "*",
  "populate[image]": "*",
  "pagination[pageSize]": "100",
  "sort": "sortOrder:asc",
  "status": "published",
});

const categoryQuery = new URLSearchParams({
  "pagination[pageSize]": "100",
  "sort": "sortOrder:asc",
});

const newsQuery = new URLSearchParams({
  "populate[coverImage]": "*",
  "pagination[pageSize]": "50",
  "sort": "publishedDate:desc",
  "status": "published",
});

const eventQuery = new URLSearchParams({
  "populate[coverImage]": "*",
  "pagination[pageSize]": "50",
  "sort": "startDate:asc",
  "status": "published",
});

const ticketTypeQuery = new URLSearchParams({
  "pagination[pageSize]": "100",
  "sort": "sortOrder:asc",
  "status": "published",
});

const bookingOptionQuery = new URLSearchParams({
  "pagination[pageSize]": "100",
  "sort": "sortOrder:asc",
  "status": "published",
});

const visitSlotQuery = new URLSearchParams({
  "pagination[pageSize]": "100",
  "sort": "date:asc",
});

const menuItemQuery = new URLSearchParams({
  "pagination[pageSize]": "100",
  "sort": "sortOrder:asc",
  "status": "published",
});

const fetchJson = async (path) => {
  const response = await fetch(`${strapiUrl}${path}`);
  const body = await response.text();
  const payload = body ? JSON.parse(body) : null;

  if (!response.ok) {
    const message = payload?.error?.message || body || response.statusText;
    throw new Error(`${path} failed (${response.status}): ${message}`);
  }

  return payload;
};

const value = (item, key) => {
  if (!item) return undefined;
  if (Object.prototype.hasOwnProperty.call(item, key)) return item[key];
  return item.attributes?.[key];
};

const mediaUrl = (item) => {
  const image = value(item, "image") || value(item, "coverImage");
  const media = image?.data?.attributes || image?.data || image;
  return media?.url || null;
};

const assert = (condition, message, failures) => {
  if (!condition) failures.push(message);
};

const run = async () => {
  const [vehiclesPayload, categoriesPayload] = await Promise.all([
    fetchJson(`/api/vehicles?${vehicleQuery.toString()}`),
    fetchJson(`/api/vehicle-categories?${categoryQuery.toString()}`),
  ]);

  const [newsPayload, eventsPayload] = await Promise.all([
    fetchJson(`/api/news-articles?${newsQuery.toString()}`),
    fetchJson(`/api/events?${eventQuery.toString()}`),
  ]);

  const [ticketPayload, optionPayload, slotPayload, menuPayload] = await Promise.all([
    fetchJson(`/api/ticket-types?${ticketTypeQuery.toString()}`),
    fetchJson(`/api/booking-options?${bookingOptionQuery.toString()}`),
    fetchJson(`/api/visit-slots?${visitSlotQuery.toString()}`),
    fetchJson(`/api/restaurant-menu-items?${menuItemQuery.toString()}`),
  ]);

  const vehicles = vehiclesPayload.data || [];
  const categories = categoriesPayload.data || [];
  const news = newsPayload.data || [];
  const events = eventsPayload.data || [];
  const ticketTypes = ticketPayload.data || [];
  const bookingOptions = optionPayload.data || [];
  const visitSlots = slotPayload.data || [];
  const menuItems = menuPayload.data || [];
  const firstVehicle = vehicles[0];
  const firstArticle = news[0];
  const firstEvent = events[0];
  const firstTicket = ticketTypes[0];
  const firstMenuItem = menuItems[0];
  const failures = [];

  assert(vehicles.length >= expectedVehicles, `expected at least ${expectedVehicles} vehicles, got ${vehicles.length}`, failures);
  assert(categories.length >= expectedCategories, `expected at least ${expectedCategories} categories, got ${categories.length}`, failures);
  assert(news.length >= expectedNews, `expected at least ${expectedNews} news articles, got ${news.length}`, failures);
  assert(events.length >= expectedEvents, `expected at least ${expectedEvents} events, got ${events.length}`, failures);
  assert(ticketTypes.length >= expectedTicketTypes, `expected at least ${expectedTicketTypes} ticket types, got ${ticketTypes.length}`, failures);
  assert(bookingOptions.length >= expectedBookingOptions, `expected at least ${expectedBookingOptions} booking options, got ${bookingOptions.length}`, failures);
  assert(visitSlots.length >= expectedVisitSlots, `expected at least ${expectedVisitSlots} visit slots, got ${visitSlots.length}`, failures);
  assert(menuItems.length >= expectedMenuItems, `expected at least ${expectedMenuItems} menu items, got ${menuItems.length}`, failures);
  assert(Boolean(value(firstVehicle, "title")), "first vehicle has no title", failures);
  assert(Boolean(value(firstVehicle, "slug")), "first vehicle has no slug", failures);
  assert(Boolean(value(firstVehicle, "summary")), "first vehicle has no summary", failures);
  assert(
    Boolean(mediaUrl(firstVehicle) || value(firstVehicle, "legacyImagePath")),
    "first vehicle has neither uploaded media nor legacy image path",
    failures,
  );
  assert(Boolean(value(firstArticle, "title")), "first news article has no title", failures);
  assert(Boolean(value(firstArticle, "slug")), "first news article has no slug", failures);
  assert(Boolean(value(firstArticle, "excerpt")), "first news article has no excerpt", failures);
  assert(
    Boolean(mediaUrl(firstArticle) || value(firstArticle, "coverImagePath")),
    "first news article has neither uploaded media nor fallback cover image path",
    failures,
  );
  assert(Boolean(value(firstEvent, "title")), "first event has no title", failures);
  assert(Boolean(value(firstEvent, "slug")), "first event has no slug", failures);
  assert(Boolean(value(firstEvent, "startDate")), "first event has no start date", failures);
  assert(Boolean(value(firstTicket, "name")), "first ticket type has no name", failures);
  assert(Boolean(value(firstTicket, "price") !== undefined), "first ticket type has no price", failures);
  assert(Boolean(value(firstMenuItem, "name")), "first restaurant menu item has no name", failures);
  assert(Boolean(value(firstMenuItem, "category")), "first restaurant menu item has no category", failures);

  console.log(`Strapi public API: ${vehicles.length} vehicles, ${categories.length} categories.`);
  console.log(`Sample: ${value(firstVehicle, "title") || "n/a"} (${value(firstVehicle, "year") || "n/a"})`);
  console.log(`Editorial API: ${news.length} news articles, ${events.length} events.`);
  console.log(`Commerce API: ${ticketTypes.length} ticket types, ${bookingOptions.length} options, ${visitSlots.length} slots, ${menuItems.length} menu items.`);

  if (failures.length) {
    console.error("Public API check failed:");
    failures.forEach((failure) => console.error(`- ${failure}`));
    process.exitCode = 1;
    return;
  }

  console.log("Public API check passed.");
};

run().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
