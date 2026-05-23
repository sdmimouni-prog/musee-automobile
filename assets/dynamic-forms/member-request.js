import {
  attachSubmissionSecurity,
  required,
  setBusy,
  setStatus,
  submissionSecurity,
  submitContent
} from "./form-service.js";

const form = document.querySelector(".club-form");
const trigger = document.querySelector(".club-panel .btn-primary");

attachSubmissionSecurity(form);

const membershipTypes = {
  "Passionné": "passionate",
  "Collectionneur": "collector",
  "Corporate / partenaire": "corporate"
};

const collectPayload = () => {
  const fields = [...form.querySelectorAll("input, select, textarea")];
  const payload = {
    name: fields[0]?.value?.trim(),
    email: fields[1]?.value?.trim(),
    phone: fields[2]?.value?.trim(),
    membershipType: membershipTypes[fields[3]?.value] || "passionate",
    message: fields[4]?.value?.trim(),
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
    setStatus(trigger, "loading", "Envoi de la demande d'adhésion...");
    const result = await submitContent("memberRequest", payload);
    setStatus(trigger, "success", `Demande envoyée (${result.source}). L'équipe membres revient vers vous rapidement.`);
    form.reset();
  } catch (error) {
    setStatus(trigger, "error", error.message);
  } finally {
    setBusy(trigger, false);
  }
});
