const defaultTo = "contact@musee-automobile.ma";

const readEnvNumber = (name, fallback) => {
  const value = Number.parseInt(process.env[name] || "", 10);
  return Number.isFinite(value) ? value : fallback;
};

const createReference = (prefix = "CAM") => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
};

const json = (res, status, payload) => {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.end(JSON.stringify(payload));
};

const normalizeBody = (req) => {
  const raw = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
  return raw.data && typeof raw.data === "object" ? raw.data : raw;
};

const validateSecurity = (payload) => {
  const security = payload?._website || {};
  const honeypot = String(security.honeypot || "").trim();
  if (honeypot) {
    const error = new Error("Spam detected");
    error.statusCode = 400;
    throw error;
  }

  const minElapsed = readEnvNumber("PUBLIC_FORM_MIN_ELAPSED_MS", 1200);
  const elapsedMs = Number(security.elapsedMs || 0);
  if (elapsedMs && elapsedMs < minElapsed) {
    const error = new Error("Le formulaire a été soumis trop rapidement.");
    error.statusCode = 400;
    throw error;
  }
};

const requireFields = (payload, fields) => {
  const missing = fields.filter((field) => !String(payload[field] ?? "").trim());
  if (missing.length) {
    const error = new Error("Merci de compléter les champs obligatoires.");
    error.statusCode = 400;
    throw error;
  }
};

const formatLine = (label, value) => {
  if (value === undefined || value === null || value === "") return null;
  if (Array.isArray(value)) {
    return `${label}: ${value.join(", ")}`;
  }
  if (typeof value === "object") {
    return `${label}: ${JSON.stringify(value)}`;
  }
  return `${label}: ${value}`;
};

const buildTextBody = ({ title, reference, payload, lines, locale = "fr" }) => {
  const intro =
    locale === "en"
      ? "A new website request has been submitted."
      : "Une nouvelle demande a ete envoyee depuis le site web.";

  return [
    title,
    `Reference: ${reference}`,
    "",
    intro,
    "",
    ...lines.map(([label, value]) => formatLine(label, value)).filter(Boolean),
    "",
    "Payload JSON:",
    JSON.stringify(payload, null, 2)
  ].join("\n");
};

const buildHtmlBody = ({ title, reference, lines, locale = "fr" }) => {
  const intro =
    locale === "en"
      ? "A new website request has been submitted."
      : "Une nouvelle demande a ete envoyee depuis le site web.";

  const rows = lines
    .map(([label, value]) => {
      if (value === undefined || value === null || value === "") return "";
      const normalized = Array.isArray(value) ? value.join(", ") : String(value);
      return `<tr><td style="padding:8px 12px;border:1px solid #ddd;font-weight:600">${label}</td><td style="padding:8px 12px;border:1px solid #ddd">${normalized}</td></tr>`;
    })
    .join("");

  return `
    <div style="font-family:Arial,sans-serif;color:#111;line-height:1.5">
      <h2 style="margin-bottom:8px">${title}</h2>
      <p style="margin-top:0"><strong>Reference:</strong> ${reference}</p>
      <p>${intro}</p>
      <table style="border-collapse:collapse;width:100%;max-width:760px">${rows}</table>
    </div>
  `;
};

module.exports = {
  defaultTo,
  createReference,
  json,
  normalizeBody,
  validateSecurity,
  requireFields,
  buildTextBody,
  buildHtmlBody
};
