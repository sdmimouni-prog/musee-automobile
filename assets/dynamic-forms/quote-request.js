import {
  attachSubmissionSecurity,
  required,
  setBusy,
  setStatus,
  submissionSecurity,
  submitContent,
  toInteger
} from "./form-service.js";

const form = document.querySelector(".event-form");
const trigger = document.querySelector(".request-card .btn-primary");

attachSubmissionSecurity(form);

const eventTypes = {
  "Séminaire / conférence": "seminar",
  "Lancement produit": "product_launch",
  "Gala / dîner privé": "gala",
  "Mariage / réception": "wedding",
  "Team building": "team_building",
  "Visite éducative / groupe": "school_visit",
  "Privatisation complète": "privatization"
};

const collectPayload = () => {
  const fields = [...form.querySelectorAll("input, select, textarea")];
  const payload = {
    name: fields[0]?.value?.trim(),
    email: fields[1]?.value?.trim(),
    phone: fields[2]?.value?.trim(),
    eventType: eventTypes[fields[3]?.value] || "other",
    guestCount: toInteger(fields[4]?.value, 0),
    desiredDate: fields[5]?.value?.trim(),
    message: fields[6]?.value?.trim(),
    status: "new",
    _website: submissionSecurity(form)
  };

  required(payload, ["name", "email"]);
  return payload;
};

trigger?.addEventListener("click", async (event) => {
  event.preventDefault();

  try {
    const payload = collectPayload();
    setBusy(trigger, true);
    setStatus(trigger, "loading", "Envoi de la demande de devis...");
    const result = await submitContent("quoteRequest", payload);
    setStatus(trigger, "success", `Demande envoyée (${result.source}). L'équipe vous recontacte rapidement.`);
    form.reset();
  } catch (error) {
    setStatus(trigger, "error", error.message);
  } finally {
    setBusy(trigger, false);
  }
});
