import {
  createVehicleCard,
  escapeHtml,
  imageUrl,
  loadCollectionData,
  summarizeVehicle
} from "./data-service.js";

const els = {
  detailHero: document.querySelector("#detailHero"),
  detailBody: document.querySelector("#detailBody"),
  detailEmpty: document.querySelector("#detailEmpty"),
  relatedSection: document.querySelector("#relatedSection"),
  vehicleImage: document.querySelector("#vehicleImage"),
  vehicleEyebrow: document.querySelector("#vehicleEyebrow"),
  vehicleTitle: document.querySelector("#vehicleTitle"),
  vehicleSummary: document.querySelector("#vehicleSummary"),
  vehicleFacts: document.querySelector("#vehicleFacts"),
  vehicleStory: document.querySelector("#vehicleStory"),
  vehicleSpecs: document.querySelector("#vehicleSpecs"),
  relatedGrid: document.querySelector("#relatedGrid")
};

const params = new URLSearchParams(window.location.search);
const slug = params.get("slug");

const renderFacts = (vehicle) => {
  const facts = summarizeVehicle(vehicle);
  els.vehicleFacts.innerHTML = `
    <div><dt>Année</dt><dd>${escapeHtml(facts.year)}</dd></div>
    <div><dt>Famille</dt><dd>${escapeHtml(facts.category)}</dd></div>
    <div><dt>Origine</dt><dd>${escapeHtml(facts.country)}</dd></div>
  `;
};

const renderSpecs = (vehicle) => {
  if (!vehicle.specs?.length) {
    els.vehicleSpecs.innerHTML = "<p>Aucune donnée technique structurée pour cette pièce.</p>";
    return;
  }

  els.vehicleSpecs.innerHTML = vehicle.specs.map((spec) => `
    <div class="spec-line">
      <strong>${escapeHtml(spec.label)}</strong>
      <span>${escapeHtml(spec.value)}</span>
    </div>
  `).join("");
};

const relatedVehicles = (vehicle, vehicles) => {
  const categorySet = new Set(vehicle.categorySlugs || []);
  return vehicles
    .filter((candidate) => candidate.slug !== vehicle.slug)
    .map((candidate) => {
      const overlap = (candidate.categorySlugs || []).filter((slug) => categorySet.has(slug)).length;
      const yearDistance = Math.abs((candidate.year || 0) - (vehicle.year || 0));
      return { candidate, score: overlap * 1000 - yearDistance };
    })
    .filter((item) => item.score > -200)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map((item) => item.candidate);
};

const renderVehicle = (vehicle, vehicles) => {
  const facts = summarizeVehicle(vehicle);
  document.title = `${vehicle.title} | Musée de l'Automobile du Maroc`;
  els.vehicleImage.src = imageUrl(vehicle);
  els.vehicleImage.alt = vehicle.title;
  els.vehicleEyebrow.textContent = `${facts.category} · ${facts.year} · ${facts.country}`;
  els.vehicleTitle.textContent = vehicle.title;
  els.vehicleSummary.textContent = vehicle.summary || "";
  els.vehicleStory.textContent = vehicle.story || vehicle.summary || "";
  renderFacts(vehicle);
  renderSpecs(vehicle);

  const related = relatedVehicles(vehicle, vehicles);
  els.relatedGrid.innerHTML = "";
  related.forEach((candidate) => els.relatedGrid.appendChild(createVehicleCard(candidate)));
  els.relatedSection.hidden = related.length === 0;

  els.detailHero.hidden = false;
  els.detailBody.hidden = false;
};

const init = async () => {
  const data = await loadCollectionData();
  const vehicle = data.vehicles.find((item) => item.slug === slug);

  if (!vehicle) {
    els.detailEmpty.hidden = false;
    return;
  }

  renderVehicle(vehicle, data.vehicles);
};

init().catch((error) => {
  console.error(error);
  els.detailEmpty.hidden = false;
});
