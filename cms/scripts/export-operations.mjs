import fs from "node:fs/promises";
import path from "node:path";

const strapiUrl = (process.env.STRAPI_URL || "http://localhost:1337").replace(/\/$/, "");
const strapiAdminUrl = (process.env.STRAPI_ADMIN_URL || process.env.PUBLIC_URL || strapiUrl).replace(/\/$/, "");
const apiToken = process.env.STRAPI_API_TOKEN;
const args = process.argv.slice(2);
const sampleMode = args.includes("--sample");

const readFlagValue = (name, fallback) => {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : fallback;
};

const readCsvFlag = (name) => {
  const value = readFlagValue(name, "");
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
};

const outDir = readFlagValue("--out", "exports/operations");
const statusFilter = readCsvFlag("--status");
const notificationFilter = readCsvFlag("--notification-status");
const typeFilter = readCsvFlag("--type");
const since = readFlagValue("--since", "");
const until = readFlagValue("--until", "");
const limit = Number.parseInt(readFlagValue("--limit", "500"), 10);

if (!apiToken && !sampleMode) {
  console.error("Missing STRAPI_API_TOKEN. Use --sample to generate a local example without Strapi.");
  process.exit(1);
}

const types = [
  {
    key: "booking",
    label: "Réservations visite",
    collection: "bookings",
    uid: "api::booking.booking",
    openStatuses: ["draft", "pending"],
  },
  {
    key: "quote-request",
    label: "Demandes de devis",
    collection: "quote-requests",
    uid: "api::quote-request.quote-request",
    openStatuses: ["new", "contacted", "quoted"],
  },
  {
    key: "restaurant-reservation",
    label: "Réservations restaurant",
    collection: "restaurant-reservations",
    uid: "api::restaurant-reservation.restaurant-reservation",
    openStatuses: ["new"],
  },
  {
    key: "member-request",
    label: "Demandes membre",
    collection: "member-requests",
    uid: "api::member-request.member-request",
    openStatuses: ["new", "contacted"],
  },
];

const selectedTypes = types.filter((type) => !typeFilter.length || typeFilter.includes(type.key));

const value = (item, key) => {
  if (!item) return undefined;
  if (Object.prototype.hasOwnProperty.call(item, key)) return item[key];
  return item.attributes?.[key];
};

const formatDateTime = (value) => {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toISOString();
};

const adminUrl = (type, item) => {
  const id = value(item, "documentId") || value(item, "id");
  return `${strapiAdminUrl}/admin/content-manager/collection-types/${type.uid}/${id}`;
};

const compact = (value) => {
  if (value === null || value === undefined) return "";
  if (Array.isArray(value)) return value.map(compact).filter(Boolean).join(", ");
  if (typeof value === "object") return JSON.stringify(value);
  return String(value).replace(/\s+/g, " ").trim();
};

const dateOnly = (value) => {
  if (!value) return "";
  return String(value).slice(0, 10);
};

const normalize = (type, item) => {
  const base = {
    type: type.key,
    typeLabel: type.label,
    id: value(item, "id") || "",
    documentId: value(item, "documentId") || "",
    createdAt: formatDateTime(value(item, "createdAt")),
    updatedAt: formatDateTime(value(item, "updatedAt")),
    status: value(item, "status") || "",
    notificationStatus: value(item, "notificationStatus") || "pending",
    notificationSentAt: formatDateTime(value(item, "notificationSentAt")),
    notificationError: compact(value(item, "notificationError")),
    assignedTo: value(item, "assignedTo") || "",
    contactedAt: formatDateTime(value(item, "contactedAt")),
    name: value(item, "name") || value(item, "customerName") || "",
    email: value(item, "email") || "",
    phone: value(item, "phone") || "",
    requestedDate: "",
    slot: "",
    amount: "",
    guestCount: "",
    summary: "",
    message: value(item, "message") || value(item, "notes") || "",
    adminUrl: adminUrl(type, item),
  };

  if (type.key === "booking") {
    base.requestedDate = value(item, "visitDate") || "";
    base.slot = value(item, "visitSlot") || "";
    base.amount = value(item, "amount") ?? "";
    base.guestCount = value(item, "ticketCount") ?? "";
    base.summary = compact(value(item, "lineItems") || value(item, "options"));
  }

  if (type.key === "quote-request") {
    base.requestedDate = value(item, "desiredDate") || "";
    base.guestCount = value(item, "guestCount") ?? "";
    base.summary = value(item, "eventType") || "";
  }

  if (type.key === "restaurant-reservation") {
    base.requestedDate = value(item, "reservationDate") || "";
    base.slot = value(item, "slot") || "";
    base.guestCount = value(item, "guestCount") ?? "";
  }

  if (type.key === "member-request") {
    base.summary = value(item, "membershipType") || "";
  }

  return base;
};

const headers = () => ({
  Authorization: `Bearer ${apiToken}`,
});

const requestJson = async (endpoint) => {
  const response = await fetch(`${strapiUrl}${endpoint}`, { headers: headers() });
  const body = await response.text();
  const payload = body ? JSON.parse(body) : null;
  if (!response.ok) throw new Error(`GET ${endpoint} failed (${response.status}): ${body}`);
  return payload;
};

const queryString = (pairs) => {
  const params = new URLSearchParams();
  pairs.forEach(([key, val]) => params.append(key, val));
  return params.toString();
};

const fetchType = async (type) => {
  const rows = [];
  let page = 1;
  let pageCount = 1;

  while (page <= pageCount && rows.length < limit) {
    const query = queryString([
      ["pagination[page]", String(page)],
      ["pagination[pageSize]", "100"],
      ["sort", "createdAt:desc"],
    ]);
    const payload = await requestJson(`/api/${type.collection}?${query}`);
    rows.push(...(payload.data || []));
    pageCount = payload.meta?.pagination?.pageCount || page;
    page += 1;
  }

  return rows.slice(0, limit).map((item) => normalize(type, item));
};

const sampleData = () => {
  const now = new Date().toISOString();
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  return [
    normalize(types[0], {
      id: 1,
      documentId: "sample-booking",
      createdAt: now,
      updatedAt: now,
      reference: "VIS-SAMPLE",
      customerName: "Client Exemple",
      email: "client@example.com",
      phone: "+212 600 000 000",
      visitDate: tomorrow,
      visitSlot: "10h00",
      ticketCount: 2,
      amount: 400,
      status: "pending",
      paymentStatus: "unpaid",
      notificationStatus: "sent",
      lineItems: [{ name: "Adulte", quantity: 2, unitPrice: 200 }],
    }),
    normalize(types[1], {
      id: 2,
      documentId: "sample-quote",
      createdAt: now,
      updatedAt: now,
      name: "Entreprise Exemple",
      email: "event@example.com",
      phone: "+212 600 000 001",
      eventType: "seminar",
      guestCount: 80,
      desiredDate: nextWeek,
      message: "Séminaire avec visite guidée.",
      status: "new",
      notificationStatus: "failed",
      notificationError: "SMTP rejected authentication",
    }),
    normalize(types[2], {
      id: 3,
      documentId: "sample-restaurant",
      createdAt: now,
      updatedAt: now,
      name: "Table Exemple",
      email: "table@example.com",
      phone: "+212 600 000 002",
      guestCount: 4,
      reservationDate: tomorrow,
      slot: "dinner",
      status: "new",
      notificationStatus: "skipped",
      notificationError: "SMTP not configured",
    }),
    normalize(types[3], {
      id: 4,
      documentId: "sample-member",
      createdAt: now,
      updatedAt: now,
      name: "Membre Exemple",
      email: "member@example.com",
      phone: "+212 600 000 003",
      membershipType: "collector",
      message: "Souhaite rejoindre le cercle collectionneur.",
      status: "contacted",
      notificationStatus: "sent",
      assignedTo: "Equipe membres",
      contactedAt: now,
    }),
  ];
};

const filters = (row) => {
  if (typeFilter.length && !typeFilter.includes(row.type)) return false;
  if (statusFilter.length && !statusFilter.includes(row.status)) return false;
  if (notificationFilter.length && !notificationFilter.includes(row.notificationStatus)) return false;
  if (since && dateOnly(row.createdAt) < since) return false;
  if (until && dateOnly(row.createdAt) > until) return false;
  return true;
};

const csvColumns = [
  "type",
  "typeLabel",
  "id",
  "documentId",
  "createdAt",
  "updatedAt",
  "status",
  "notificationStatus",
  "notificationSentAt",
  "notificationError",
  "assignedTo",
  "contactedAt",
  "name",
  "email",
  "phone",
  "requestedDate",
  "slot",
  "amount",
  "guestCount",
  "summary",
  "message",
  "adminUrl",
];

const escapeCsv = (value) => {
  const text = String(value ?? "");
  if (/[",\n\r]/.test(text)) return `"${text.replaceAll('"', '""')}"`;
  return text;
};

const toCsv = (rows) => [
  csvColumns.join(","),
  ...rows.map((row) => csvColumns.map((column) => escapeCsv(row[column])).join(",")),
].join("\n");

const countBy = (rows, key) => rows.reduce((counts, row) => {
  const value = row[key] || "empty";
  counts[value] = (counts[value] || 0) + 1;
  return counts;
}, {});

const isOpen = (row) => {
  const config = types.find((type) => type.key === row.type);
  return config?.openStatuses.includes(row.status);
};

const isUpcoming = (row) => {
  if (!row.requestedDate) return false;
  const today = new Date().toISOString().slice(0, 10);
  const week = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  return row.requestedDate >= today && row.requestedDate <= week;
};

const markdownTable = (columns, rows) => [
  `| ${columns.join(" | ")} |`,
  `| ${columns.map(() => "---").join(" | ")} |`,
  ...rows.map((row) => `| ${columns.map((column) => String(row[column] ?? "").replaceAll("|", "\\|")).join(" | ")} |`),
].join("\n");

const summarizeType = (rows, type) => {
  const subset = rows.filter((row) => row.type === type.key);
  return {
    Type: type.label,
    Total: subset.length,
    Ouvertes: subset.filter(isOpen).length,
    "Sans responsable": subset.filter((row) => isOpen(row) && !row.assignedTo).length,
    "Non contactées": subset.filter((row) => isOpen(row) && !row.contactedAt).length,
    "Notif. à vérifier": subset.filter((row) => ["failed", "skipped", "pending"].includes(row.notificationStatus)).length,
  };
};

const renderRequestTable = (rows) => markdownTable(
  ["Type", "Statut", "Notification", "Nom", "Date", "Assigné", "Lien"],
  rows.slice(0, 15).map((row) => ({
    Type: row.typeLabel,
    Statut: row.status,
    Notification: row.notificationStatus,
    Nom: row.name,
    Date: row.requestedDate || dateOnly(row.createdAt),
    Assigné: row.assignedTo || "—",
    Lien: row.adminUrl,
  })),
);

const reportMarkdown = (rows, files) => {
  const generatedAt = new Date().toISOString();
  const statusCounts = countBy(rows, "status");
  const notificationCounts = countBy(rows, "notificationStatus");
  const notificationIssues = rows.filter((row) => ["failed", "skipped", "pending"].includes(row.notificationStatus));
  const uncontacted = rows.filter((row) => isOpen(row) && !row.contactedAt);
  const unassigned = rows.filter((row) => isOpen(row) && !row.assignedTo);
  const upcoming = rows.filter(isUpcoming).sort((a, b) => String(a.requestedDate).localeCompare(String(b.requestedDate)));

  return `# Rapport opérationnel des demandes

Généré le ${generatedAt}${sampleMode ? " (mode exemple)" : ""}.

## Synthèse

${markdownTable(["Type", "Total", "Ouvertes", "Sans responsable", "Non contactées", "Notif. à vérifier"], selectedTypes.map((type) => summarizeType(rows, type)))}

## Statuts

- Statuts métier: ${Object.entries(statusCounts).map(([key, val]) => `${key}: ${val}`).join(", ") || "aucune donnée"}
- Notifications: ${Object.entries(notificationCounts).map(([key, val]) => `${key}: ${val}`).join(", ") || "aucune donnée"}

## Priorités

- Notifications à vérifier: ${notificationIssues.length}
- Demandes ouvertes sans responsable: ${unassigned.length}
- Demandes ouvertes non contactées: ${uncontacted.length}
- Réservations ou événements à venir sous 7 jours: ${upcoming.length}

## Notifications à vérifier

${notificationIssues.length ? renderRequestTable(notificationIssues) : "Aucune notification à vérifier."}

## Non contactées

${uncontacted.length ? renderRequestTable(uncontacted) : "Aucune demande ouverte non contactée."}

## À venir sous 7 jours

${upcoming.length ? renderRequestTable(upcoming) : "Aucune demande datée sous 7 jours."}

## Dernières demandes

${rows.length ? renderRequestTable(rows.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))) : "Aucune demande exportée."}

## Fichiers générés

${files.map((file) => `- ${file}`).join("\n")}
`;
};

const ensureDir = async (dir) => {
  await fs.mkdir(dir, { recursive: true });
};

const main = async () => {
  const allRows = sampleMode
    ? sampleData()
    : (await Promise.all(selectedTypes.map(fetchType))).flat();
  const rows = allRows.filter(filters);

  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const exportDir = path.resolve(outDir, stamp);
  await ensureDir(exportDir);

  const files = [];
  const writeFile = async (name, content) => {
    const filePath = path.join(exportDir, name);
    await fs.writeFile(filePath, `${content.trimEnd()}\n`);
    files.push(path.relative(process.cwd(), filePath));
  };

  await writeFile("all-requests.csv", toCsv(rows));

  for (const type of selectedTypes) {
    await writeFile(`${type.key}.csv`, toCsv(rows.filter((row) => row.type === type.key)));
  }

  const reportPath = path.relative(process.cwd(), path.join(exportDir, "report.md"));
  await writeFile("report.md", reportMarkdown(rows, [...files, reportPath]));

  console.log(`Exported ${rows.length} requests to ${path.relative(process.cwd(), exportDir)}`);
  files.forEach((file) => console.log(`- ${file}`));
};

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
