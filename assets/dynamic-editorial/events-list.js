import {
  dayNumber,
  escapeAttribute,
  escapeHtml,
  eventHref,
  eventStatusLabels,
  formatDate,
  imageUrl,
  loadEditorialData,
  monthTime
} from "./editorial-service.js";

const els = {
  grid: document.querySelector(".agenda-grid"),
  filterStrip: document.querySelector(".filter-strip"),
  stats: document.querySelectorAll(".hero-stats .stat"),
  heroPrimary: document.querySelector(".hero-actions .btn-primary")
};

const state = {
  events: [],
  source: "JSON",
  tag: "all",
  query: ""
};

const tools = document.createElement("div");
tools.className = "editorial-tools reveal is-visible";
tools.innerHTML = `
  <input class="editorial-search" type="search" placeholder="Rechercher un événement...">
  <span class="editorial-source">Source: JSON</span>
`;

const empty = document.createElement("div");
empty.className = "editorial-empty";
empty.hidden = true;
empty.textContent = "Aucun événement ne correspond à cette recherche.";

els.filterStrip?.before(tools);
els.grid?.after(empty);

const searchInput = tools.querySelector(".editorial-search");
const sourceBadge = tools.querySelector(".editorial-source");

const allTags = () => [...new Set(state.events.flatMap((event) => event.tags || []))];

const eventMatches = (event) => {
  const tagMatch = state.tag === "all" || (event.tags || []).includes(state.tag);
  if (!tagMatch) return false;
  const query = state.query.trim().toLowerCase();
  if (!query) return true;
  return [event.title, event.excerpt, event.description, event.venue, ...(event.tags || [])]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .includes(query);
};

const createCard = (event) => {
  const tags = event.tags?.length ? event.tags : [eventStatusLabels[event.status] || "Événement"];
  const card = document.createElement("article");
  card.className = "agenda-card has-image reveal is-visible";
  card.innerHTML = `
    <img class="agenda-photo" src="${escapeAttribute(imageUrl(event))}" alt="${escapeAttribute(event.title)}" loading="lazy">
    <div class="agenda-date">
      <strong>${escapeHtml(dayNumber(event.startDate))}</strong>
      <span>${escapeHtml(monthTime(event.startDate))}</span>
    </div>
    <div class="agenda-content">
      <div class="agenda-meta">
        <span>${escapeHtml(tags[0])}</span>
        <span>${escapeHtml(tags[1] || eventStatusLabels[event.status] || "Agenda")}</span>
      </div>
      <h3>${escapeHtml(event.title)}</h3>
      <p>${escapeHtml(event.excerpt)}</p>
      <a class="btn btn-secondary" href="${eventHref(event)}">Détails</a>
    </div>
  `;
  return card;
};

const renderFilters = () => {
  if (!els.filterStrip) return;
  els.filterStrip.innerHTML = "";

  const createButton = (tag, label) => {
    const button = document.createElement("button");
    button.className = "filter-pill";
    button.type = "button";
    button.dataset.tag = tag;
    button.setAttribute("aria-pressed", String(state.tag === tag));
    button.textContent = label;
    els.filterStrip.appendChild(button);
  };

  createButton("all", "Tous");
  allTags().forEach((tag) => createButton(tag, tag));
};

const renderStats = () => {
  const nextEvent = state.events[0];
  const tags = allTags();

  if (els.stats[0]) {
    els.stats[0].querySelector("strong").textContent = String(state.events.length);
    els.stats[0].querySelector("span").textContent = "rendez-vous";
  }
  if (els.stats[1]) {
    els.stats[1].querySelector("strong").textContent = nextEvent ? formatDate(nextEvent.startDate) : "À venir";
    els.stats[1].querySelector("span").textContent = "prochain événement";
  }
  if (els.stats[2]) {
    els.stats[2].querySelector("strong").textContent = String(tags.length);
    els.stats[2].querySelector("span").textContent = "formats";
  }
  if (els.heroPrimary && nextEvent) {
    els.heroPrimary.href = eventHref(nextEvent);
  }
  sourceBadge.textContent = `Source: ${state.source}`;
};

const renderGrid = () => {
  const items = state.events.filter(eventMatches);
  els.grid.innerHTML = "";
  items.forEach((event) => els.grid.appendChild(createCard(event)));
  empty.hidden = items.length !== 0;
};

const bindEvents = () => {
  searchInput.addEventListener("input", () => {
    state.query = searchInput.value.trim();
    renderGrid();
  });

  els.filterStrip?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-tag]");
    if (!button) return;

    state.tag = button.dataset.tag;
    renderFilters();
    renderGrid();
  });
};

const init = async () => {
  if (!els.grid) return;
  const data = await loadEditorialData();
  state.events = data.events.sort((a, b) => new Date(a.startDate || 0) - new Date(b.startDate || 0));
  state.source = data.source;
  renderFilters();
  renderStats();
  renderGrid();
  bindEvents();
};

init().catch((error) => {
  console.error(error);
  empty.hidden = false;
  empty.textContent = "Impossible de charger l'agenda dynamique.";
});
