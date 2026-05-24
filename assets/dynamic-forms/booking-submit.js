import {
  attachSubmissionSecurity,
  createReference,
  money,
  required,
  setBusy,
  setStatus,
  submissionSecurity,
  submitContent,
  toInteger
} from "./form-service.js";

const form = document.querySelector(".form-panel > form.form-grid");
const summaryPanel = document.querySelector(".summary-panel");
const submitLink = summaryPanel?.querySelector(".btn-primary");
const params = new URLSearchParams(window.location.search);

attachSubmissionSecurity(form);

const readDraft = () => {
  try {
    const draft = JSON.parse(sessionStorage.getItem("camBookingDraft") || "{}");
    if (!draft.createdAt) return {};

    const age = Date.now() - new Date(draft.createdAt).getTime();
    if (age > 4 * 60 * 60 * 1000) return {};

    return draft;
  } catch (error) {
    console.warn(error.message);
    return {};
  }
};

const fallbackDate = () => {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return date.toISOString().slice(0, 10);
};

const draft = {
  type: params.get("type") || "individuel",
  visitDate: params.get("date") || fallbackDate(),
  visitSlot: params.get("slot") || "10h00",
  ticketCount: Number(params.get("tickets")) || 1,
  amount: Number(params.get("amount")) || 0,
  ...readDraft()
};

const formatIsoDate = (value) => {
  if (!value) return null;
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric"
  }).format(new Date(`${value}T12:00:00`));
};

const setSummaryValue = (label, value) => {
  const rows = [...summaryPanel.querySelectorAll(".summary-line")];
  const row = rows.find((candidate) => candidate.querySelector("strong")?.textContent?.trim() === label);
  const target = row?.querySelector("span");
  if (target && value) target.textContent = value;
};

const updateSummary = () => {
  setSummaryValue("Formule", draft.formula);
  setSummaryValue("Date", draft.visitDateLabel || formatIsoDate(draft.visitDate) || draft.visitDate);
  setSummaryValue("Créneau", draft.visitSlot);
  setSummaryValue("Billets", draft.ticketCount ? `${draft.ticketCount} ${draft.ticketCount > 1 ? "billets" : "billet"}` : null);

  const total = summaryPanel.querySelector(".summary-total");
  if (total && draft.amount) total.textContent = money(draft.amount);
};

const collectPayload = () => {
  const values = Object.fromEntries(new FormData(form).entries());
  const customerName = `${values.firstName || ""} ${values.lastName || ""}`.trim();
  const ticketCount = toInteger(draft.ticketCount, 1);

  const payload = {
    reference: createReference("VIS"),
    visitDate: draft.visitDate || fallbackDate(),
    visitSlot: draft.visitSlot || "10h00",
    customerName,
    email: values.email,
    phone: values.phone,
    ticketCount,
    lineItems: draft.lineItems?.length ? draft.lineItems : [{ name: draft.formula || "Visite individuelle", quantity: ticketCount, unitPrice: ticketCount ? Number(draft.amount || 0) / ticketCount : 0 }],
    amount: Number(draft.amount || 0),
    options: {
      bookingType: draft.type,
      formula: draft.formula || "Visite individuelle",
      selectedOptions: draft.options || [],
      paymentMethod: "Demande de reservation",
      language: values.language,
      arrival: values.arrival
    },
    status: "pending",
    paymentStatus: "unpaid",
    notes: values.notes,
    source: "website",
    locale: "fr",
    _website: submissionSecurity(form)
  };

  required(payload, ["customerName", "email", "visitDate", "visitSlot"]);
  if (payload.ticketCount < 1) throw new Error("Merci de sélectionner au moins un billet.");
  return payload;
};

updateSummary();

submitLink?.addEventListener("click", async (event) => {
  event.preventDefault();

  try {
    const payload = collectPayload();
    setBusy(submitLink, true);
    setStatus(submitLink, "loading", "Envoi de la demande de reservation...");
    const result = await submitContent("booking", payload);
    setStatus(submitLink, "success", `Demande envoyee (${result.source}) · Reference ${result.reference}`);

    const url = new URL(submitLink.href, window.location.href);
    url.searchParams.set("type", draft.type || "individuel");
    url.searchParams.set("amount", String(payload.amount));
    url.searchParams.set("reference", result.reference);
    url.searchParams.set("source", result.source.toLowerCase());
    url.searchParams.set("submitted", "1");
    window.location.href = `${url.pathname}${url.search}`;
  } catch (error) {
    setStatus(submitLink, "error", error.message);
  } finally {
    setBusy(submitLink, false);
  }
});
