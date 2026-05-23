import {
  attachSubmissionSecurity,
  formValues,
  required,
  setBusy,
  setStatus,
  submissionSecurity,
  submitContent,
  toInteger
} from "./form-service.js";

const form = document.querySelector(".reservation-form");
const submitButton = form?.querySelector("button[type='submit']");

attachSubmissionSecurity(form);

const slotValue = (label) => {
  if (label.includes("Déjeuner")) return "lunch";
  if (label.includes("Dîner")) return "dinner";
  if (label.includes("Brunch")) return "brunch";
  return "private_event";
};

const collectPayload = () => {
  const values = formValues(form);
  const isGroup = values.personnes === "groupe";
  const payload = {
    name: values.nom,
    email: values.email,
    phone: values.telephone,
    guestCount: isGroup ? 10 : toInteger(values.personnes, 2),
    reservationDate: values.date,
    slot: slotValue(values.creneau || ""),
    message: isGroup ? `Groupe / privatisation. ${values.message || ""}`.trim() : values.message,
    status: "new",
    _website: submissionSecurity(form)
  };

  required(payload, ["name", "phone", "guestCount", "reservationDate", "slot"]);
  return payload;
};

form?.addEventListener("submit", async (event) => {
  event.preventDefault();

  try {
    const payload = collectPayload();
    setBusy(submitButton, true);
    setStatus(submitButton, "loading", "Envoi de la demande de réservation...");
    const result = await submitContent("restaurantReservation", payload);
    setStatus(submitButton, "success", `Demande envoyée (${result.source}). Le Garage confirme la table par téléphone ou email.`);
    form.reset();
  } catch (error) {
    setStatus(submitButton, "error", error.message);
  } finally {
    setBusy(submitButton, false);
  }
});
