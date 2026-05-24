const defaultConfig = {
  apiBase: "",
  storageKey: "cam:pending-submissions"
};

const config = { ...defaultConfig, ...(window.CAM_FORM_CONFIG || {}) };
const pageStartedAt = Date.now();

const endpoints = {
  booking: "bookings",
  quoteRequest: "quote-requests",
  restaurantReservation: "restaurant-reservations",
  memberRequest: "member-requests"
};

export const createReference = (prefix = "CAM") => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
};

export const money = (value) => `${Number(value || 0).toLocaleString("fr-FR")} Dhs`;

export const toInteger = (value, fallback = 0) => {
  const number = Number.parseInt(String(value ?? "").replace(/\D+/g, ""), 10);
  return Number.isFinite(number) ? number : fallback;
};

export const required = (payload, fields) => {
  const missing = fields.filter((field) => !String(payload[field] ?? "").trim());
  if (missing.length) {
    throw new Error("Merci de compléter les champs obligatoires.");
  }
};

export const formValues = (form) => Object.fromEntries(new FormData(form).entries());

export const attachSubmissionSecurity = (form) => {
  if (!form || form.querySelector("[name='companyWebsite']")) return;

  form.dataset.camStartedAt = String(Date.now());
  const field = document.createElement("input");
  field.type = "text";
  field.name = "companyWebsite";
  field.tabIndex = -1;
  field.autocomplete = "off";
  field.className = "dynamic-form-honeypot";
  field.setAttribute("aria-hidden", "true");
  form.appendChild(field);
};

export const submissionSecurity = (form) => {
  const startedAt = Number(form?.dataset?.camStartedAt || pageStartedAt);
  const submittedAt = Date.now();
  const formData = form ? new FormData(form) : new FormData();

  return {
    startedAt,
    submittedAt,
    elapsedMs: submittedAt - startedAt,
    honeypot: formData.get("companyWebsite") || ""
  };
};

const postForm = async (type, data) => {
  const endpoint = endpoints[type];
  if (!endpoint) throw new Error(`Unknown submission type: ${type}`);

  const apiBase = config.apiBase || "";
  const response = await fetch(`${apiBase}/api/${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json"
    },
    body: JSON.stringify({ data })
  });

  const text = await response.text();
  const payload = text ? JSON.parse(text) : {};

  if (!response.ok) {
    const message = payload?.error?.message || response.statusText || "Strapi unavailable";
    throw new Error(message);
  }

  return {
    reference: payload?.data?.reference || data.reference || payload?.data?.documentId || payload?.data?.id,
    source: payload?.data?.source || "Email",
    payload
  };
};

export const submitContent = async (type, data) => {
  if (window.location.protocol === "file:") {
    throw new Error("Ce formulaire fonctionne sur le site en ligne. Ouvrez la version Vercel pour envoyer la demande.");
  }

  return postForm(type, data);
};

export const ensureStatus = (anchor) => {
  const existing = anchor.parentElement?.querySelector(".dynamic-form-status");
  if (existing) return existing;

  const status = document.createElement("p");
  status.className = "dynamic-form-status";
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");
  anchor.insertAdjacentElement("afterend", status);
  return status;
};

export const setStatus = (anchor, state, message) => {
  const status = ensureStatus(anchor);
  status.className = `dynamic-form-status is-${state}`;
  status.textContent = message;
};

export const setBusy = (button, busy) => {
  if (!button) return;
  button.toggleAttribute("aria-busy", busy);
  if ("disabled" in button) button.disabled = busy;
};
