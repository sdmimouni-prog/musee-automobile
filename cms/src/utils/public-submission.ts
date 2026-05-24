const submissionBuckets = new Map();

const toNumber = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

const toInteger = (value, fallback = 0) => {
  const number = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(number) ? number : fallback;
};

const todayUtc = () => {
  const now = new Date();
  return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
};

const dateUtc = (value) => {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(String(value))) return null;
  const [year, month, day] = String(value).split("-").map(Number);
  return Date.UTC(year, month - 1, day);
};

const clientIp = (ctx) => {
  const forwarded = ctx.request?.headers?.["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.trim()) return forwarded.split(",")[0].trim();
  return ctx.request?.ip || ctx.ip || "unknown";
};

const rateLimitConfig = () => ({
  max: toInteger(process.env.PUBLIC_FORM_RATE_LIMIT_MAX, 8),
  windowMs: toInteger(process.env.PUBLIC_FORM_RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000)
});

const minElapsedMs = () => toInteger(process.env.PUBLIC_FORM_MIN_ELAPSED_MS, 1200);

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^[+\d\s().-]{7,30}$/;

const cleanString = (value, limit = 500) => String(value ?? "").trim().slice(0, limit);

const assert = (ctx, condition, message, status = 400) => {
  if (!condition) ctx.throw(status, message);
};

const assertEmail = (ctx, value, required = true) => {
  const email = cleanString(value, 180).toLowerCase();
  assert(ctx, !required || Boolean(email), "Email obligatoire.");
  if (email) assert(ctx, emailPattern.test(email), "Email invalide.");
  return email;
};

const assertPhone = (ctx, value, required = false) => {
  const phone = cleanString(value, 80);
  assert(ctx, !required || Boolean(phone), "Téléphone obligatoire.");
  if (phone) assert(ctx, phonePattern.test(phone), "Téléphone invalide.");
  return phone;
};

const assertFutureDate = (ctx, value, label = "Date") => {
  const date = cleanString(value, 20);
  const utc = dateUtc(date);
  assert(ctx, utc !== null, `${label} invalide.`);
  assert(ctx, utc >= todayUtc(), `${label} déjà passée.`);
  return date;
};

const assertEnum = (ctx, value, allowed, fallback) => {
  const candidate = cleanString(value, 80);
  return allowed.includes(candidate) ? candidate : fallback;
};

const assertLength = (ctx, value, limit, label) => {
  const text = cleanString(value, limit + 1);
  assert(ctx, text.length <= limit, `${label} est trop long.`);
  return text;
};

const assertText = (ctx, value, limit, label) => {
  const text = assertLength(ctx, value, limit, label);
  assert(ctx, Boolean(text), `${label} obligatoire.`);
  return text;
};

const stripSubmissionMeta = (data) => {
  const meta = data?._website || {};
  delete data._website;
  delete data.website;
  delete data.companyWebsite;
  return meta;
};

const assertSubmissionMeta = (ctx, meta) => {
  assert(ctx, meta && typeof meta === "object", "Protection anti-spam manquante.");
  assert(ctx, !cleanString(meta.honeypot, 200), "Soumission refusée.");

  const elapsed = toInteger(meta.elapsedMs, 0);
  const startedAt = toInteger(meta.startedAt, 0);
  const submittedAt = toInteger(meta.submittedAt, 0);
  const computedElapsed = startedAt && submittedAt ? submittedAt - startedAt : elapsed;

  assert(ctx, computedElapsed >= minElapsedMs(), "Soumission trop rapide.");
  assert(ctx, computedElapsed <= 4 * 60 * 60 * 1000, "Session de formulaire expirée.");
};

const assertRateLimit = (ctx, type) => {
  const { max, windowMs } = rateLimitConfig();
  const key = `${type}:${clientIp(ctx)}`;
  const now = Date.now();
  const recent = (submissionBuckets.get(key) || []).filter((time) => now - time < windowMs);

  assert(ctx, recent.length < max, "Trop de demandes. Merci de réessayer plus tard.", 429);
  recent.push(now);
  submissionBuckets.set(key, recent);
};

const sumLineItems = (lineItems) => {
  if (!Array.isArray(lineItems)) return 0;
  return lineItems.reduce((sum, item) => {
    const quantity = toInteger(item?.quantity, 0);
    const unitPrice = toNumber(item?.unitPrice, 0);
    return sum + quantity * unitPrice;
  }, 0);
};

const normalizeLineItems = (ctx, lineItems) => {
  assert(ctx, Array.isArray(lineItems) && lineItems.length > 0, "Au moins une ligne de billet est obligatoire.");

  return lineItems.map((item) => {
    const quantity = toInteger(item?.quantity, 0);
    const unitPrice = toNumber(item?.unitPrice, 0);
    assert(ctx, quantity >= 1 && quantity <= 200, "Quantité de billet invalide.");
    assert(ctx, unitPrice >= 0 && unitPrice <= 100000, "Prix de billet invalide.");

    return {
      name: cleanString(item?.name, 120) || "Billet",
      quantity,
      unitPrice
    };
  });
};

const prepare = (ctx, type, validator) => {
  const body = ctx.request.body || {};
  const data = body.data || {};

  assertRateLimit(ctx, type);
  assertSubmissionMeta(ctx, stripSubmissionMeta(data));

  body.data = validator(ctx, data);
  ctx.request.body = body;
};

export const prepareBookingSubmission = (ctx) => prepare(ctx, "booking", (context, data) => {
  const lineItems = normalizeLineItems(context, data.lineItems);
  const ticketCount = toInteger(data.ticketCount, 0);
  const amount = toNumber(data.amount, 0);
  const expectedAmount = sumLineItems(lineItems);

  assert(context, ticketCount >= 1 && ticketCount <= 200, "Nombre de billets invalide.");
  assert(context, amount >= 0 && amount <= 1000000, "Montant invalide.");
  assert(context, Math.abs(amount - expectedAmount) <= 1, "Montant incohérent avec les billets.");

  return {
    ...data,
    reference: cleanString(data.reference, 80) || undefined,
    visitDate: assertFutureDate(context, data.visitDate, "Date de visite"),
    visitSlot: cleanString(data.visitSlot, 80) || "10h00",
    customerName: assertText(context, data.customerName, 160, "Nom visiteur"),
    email: assertEmail(context, data.email, true),
    phone: assertPhone(context, data.phone, false),
    ticketCount,
    lineItems,
    amount,
    options: data.options && typeof data.options === "object" ? data.options : {},
    status: "pending",
    paymentStatus: "unpaid",
    notes: assertLength(context, data.notes, 3000, "Message"),
    source: "website",
    locale: cleanString(data.locale, 12) || "fr"
  };
});

export const prepareQuoteRequestSubmission = (ctx) => prepare(ctx, "quote-request", (context, data) => ({
  name: assertText(context, data.name, 160, "Nom"),
  email: assertEmail(context, data.email, true),
  phone: assertPhone(context, data.phone, false),
  eventType: assertEnum(context, data.eventType, ["seminar", "product_launch", "gala", "wedding", "team_building", "school_visit", "privatization", "other"], "other"),
  guestCount: Math.min(Math.max(toInteger(data.guestCount, 0), 0), 5000),
  desiredDate: assertLength(context, data.desiredDate, 160, "Date souhaitée"),
  message: assertLength(context, data.message, 4000, "Message"),
  status: "new"
}));

export const prepareRestaurantReservationSubmission = (ctx) => prepare(ctx, "restaurant-reservation", (context, data) => ({
  name: assertText(context, data.name, 160, "Nom"),
  email: assertEmail(context, data.email, false),
  phone: assertPhone(context, data.phone, true),
  guestCount: Math.min(Math.max(toInteger(data.guestCount, 2), 1), 200),
  reservationDate: assertFutureDate(context, data.reservationDate, "Date de réservation"),
  slot: assertEnum(context, data.slot, ["lunch", "dinner", "brunch", "private_event"], "lunch"),
  message: assertLength(context, data.message, 3000, "Message"),
  status: "new"
}));

export const prepareMemberRequestSubmission = (ctx) => prepare(ctx, "member-request", (context, data) => ({
  name: assertText(context, data.name, 160, "Nom"),
  email: assertEmail(context, data.email, true),
  phone: assertPhone(context, data.phone, false),
  membershipType: assertEnum(context, data.membershipType, ["passionate", "collector", "corporate", "partner"], "passionate"),
  message: assertLength(context, data.message, 3000, "Message"),
  status: "new"
}));
