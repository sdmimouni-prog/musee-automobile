import {
  bySort,
  categoryGroups,
  escapeAttribute,
  escapeHtml,
  imageUrl,
  loadCollectionData,
  summarizeVehicle,
  textIndex,
  vehicleHref
} from "./data-service.js";

const pageSize = 12;
const isEnglish = document.documentElement.lang === "en";
const copy = isEnglish
  ? {
      searchLabel: "Search",
      searchPlaceholder: "Brand, country, year, family...",
      sortLabel: "Sort",
      source: "Source",
      empty: "No vehicles match this search.",
      discover: "Discover",
      all: "All",
      featuredYear: "Year",
      featuredFamily: "Family",
      featuredOrigin: "Origin",
      dynamicFiles: "dynamic entries",
      firstMarker: "earliest reference",
      origins: "countries represented",
      filters: "filters",
      query: "search"
    }
  : {
      searchLabel: "Recherche",
      searchPlaceholder: "Marque, pays, année, famille...",
      sortLabel: "Trier",
      source: "Source",
      empty: "Aucun véhicule ne correspond à cette recherche.",
      discover: "Découvrir",
      all: "Tous",
      featuredYear: "Repère",
      featuredFamily: "Famille",
      featuredOrigin: "Origine",
      dynamicFiles: "fiches dynamiques",
      firstMarker: "premier repère",
      origins: "origines représentées",
      filters: "filtres",
      query: "recherche"
    };

const els = {
  grid: document.querySelector(".collection-grid"),
  filterBar: document.querySelector(".filter-bar"),
  pagination: document.querySelector(".collection-pagination"),
  paginationPages: document.querySelector(".pagination-pages"),
  paginationStatus: document.querySelector(".pagination-status"),
  prev: document.querySelector('[data-page-action="prev"]'),
  next: document.querySelector('[data-page-action="next"]'),
  stats: document.querySelectorAll(".hero-stats .stat"),
  featureImage: document.querySelector(".feature-image"),
  featurePanel: document.querySelector(".feature-panel")
};

const state = {
  vehicles: [],
  categories: [],
  categoryBySlug: new Map(),
  query: "",
  sort: "sortOrder",
  selectedCategories: new Set(),
  page: 1,
  source: "JSON"
};

const tools = document.createElement("div");
tools.className = "dynamic-tools reveal is-visible";
tools.innerHTML = `
  <div class="dynamic-field">
    <label for="dynamicSearch">${copy.searchLabel}</label>
    <input class="dynamic-input" id="dynamicSearch" type="search" placeholder="${copy.searchPlaceholder}">
  </div>
  <div class="dynamic-field">
    <label for="dynamicSort">${copy.sortLabel}</label>
    <select class="dynamic-select" id="dynamicSort">
      <option value="sortOrder">${isEnglish ? "Museum path" : "Parcours musée"}</option>
      <option value="yearAsc">${isEnglish ? "Year ascending" : "Année croissante"}</option>
      <option value="yearDesc">${isEnglish ? "Year descending" : "Année décroissante"}</option>
      <option value="titleAsc">${isEnglish ? "Name A-Z" : "Nom A-Z"}</option>
      <option value="countryAsc">${isEnglish ? "Country A-Z" : "Pays A-Z"}</option>
    </select>
  </div>
  <div class="dynamic-source" id="dynamicSource">${copy.source}: JSON</div>
`;

const emptyState = document.createElement("div");
emptyState.className = "dynamic-empty";
emptyState.hidden = true;
emptyState.textContent = copy.empty;

els.filterBar?.parentElement?.insertBefore(tools, els.filterBar);
els.grid?.after(emptyState);

const searchInput = tools.querySelector("#dynamicSearch");
const sortSelect = tools.querySelector("#dynamicSort");
const sourceBadge = tools.querySelector("#dynamicSource");

const readUrlState = () => {
  const params = new URLSearchParams(window.location.search);
  state.query = params.get("q") || "";
  state.sort = params.get("sort") || "sortOrder";
  state.page = Math.max(1, Number(params.get("page")) || 1);
  state.selectedCategories = new Set((params.get("cat") || "").split(",").filter(Boolean));

  searchInput.value = state.query;
  sortSelect.value = state.sort;
};

const writeUrlState = () => {
  const params = new URLSearchParams();
  if (state.query) params.set("q", state.query);
  if (state.selectedCategories.size) params.set("cat", [...state.selectedCategories].join(","));
  if (state.sort !== "sortOrder") params.set("sort", state.sort);
  if (state.page > 1) params.set("page", String(state.page));

  const nextUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ""}#collection-grid`;
  window.history.replaceState({}, "", nextUrl);
};

const vehicleCategories = (vehicle) => (vehicle.categorySlugs || [])
  .map((slug) => state.categoryBySlug.get(slug))
  .filter(Boolean);

const matchesVehicle = (vehicle) => {
  const selected = [...state.selectedCategories];
  const hasCategories = selected.every((slug) => vehicle.categorySlugs?.includes(slug));
  if (!hasCategories) return false;

  const query = state.query.trim().toLowerCase();
  if (!query) return true;
  return textIndex(vehicle, vehicleCategories(vehicle)).includes(query);
};

const filteredVehicles = () => state.vehicles
  .filter(matchesVehicle)
  .sort(bySort(state.sort));

const createIntegratedVehicleCard = (vehicle) => {
  const facts = summarizeVehicle(vehicle);
  const card = document.createElement("article");
  card.className = "vehicle-card reveal is-visible";
  card.dataset.category = (vehicle.categorySlugs || []).join(" ");
  card.innerHTML = `
    <a class="vehicle-link" href="${vehicleHref(vehicle)}" aria-label="${isEnglish ? "Open the vehicle sheet" : "Voir la fiche"} ${escapeAttribute(vehicle.title)}">
      <div class="vehicle-media">
        <img src="${escapeAttribute(imageUrl(vehicle))}" alt="${escapeAttribute(vehicle.title)}" loading="lazy">
      </div>
      <div class="vehicle-body">
        <span class="vehicle-year">${escapeHtml(facts.year)} · ${escapeHtml(facts.country)}</span>
        <h3>${escapeHtml(vehicle.title)}</h3>
        <p>${escapeHtml(vehicle.summary || "")}</p>
        <div class="vehicle-meta">
          <span>${escapeHtml(facts.category)}</span>
          <span>${escapeHtml(facts.country)}</span>
          <span>${escapeHtml(facts.year)}</span>
        </div>
        <span class="vehicle-discover">${copy.discover}</span>
      </div>
    </a>
  `;
  return card;
};

const renderFilters = () => {
  if (!els.filterBar) return;

  els.filterBar.classList.add("is-dynamic");
  els.filterBar.innerHTML = "";

  const allButton = document.createElement("button");
  allButton.className = "filter-btn";
  allButton.type = "button";
  allButton.dataset.filter = "all";
  allButton.setAttribute("aria-pressed", String(state.selectedCategories.size === 0));
  allButton.textContent = copy.all;
  els.filterBar.appendChild(allButton);

  for (const group of categoryGroups(state.categories)) {
    const label = document.createElement("span");
    label.className = "filter-label";
    label.textContent = group.label;
    els.filterBar.appendChild(label);

    for (const category of group.categories) {
      const button = document.createElement("button");
      button.className = "filter-btn";
      button.type = "button";
      button.dataset.filter = category.slug;
      button.setAttribute("aria-pressed", String(state.selectedCategories.has(category.slug)));
      button.textContent = category.name;
      els.filterBar.appendChild(button);
    }
  }
};

const renderFeature = () => {
  const featured = state.vehicles.find((vehicle) => vehicle.isFeatured) || state.vehicles[0];
  if (!featured || !els.featurePanel) return;

  const facts = summarizeVehicle(featured);
  const title = els.featurePanel.querySelector("h2");
  const copy = els.featurePanel.querySelector("p");
  const specs = els.featurePanel.querySelector(".specs");
  const link = els.featurePanel.querySelector(".btn-primary");

  if (els.featureImage) {
    els.featureImage.setAttribute("aria-label", featured.title);
    els.featureImage.style.background = `linear-gradient(180deg, rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.44)), url("${imageUrl(featured)}") center / cover, var(--concrete)`;
  }

  if (title) title.textContent = featured.title;
  if (copy) copy.textContent = featured.summary || "";
  if (specs) {
    specs.innerHTML = `
      <div class="spec"><strong>${escapeHtml(facts.year)}</strong><span>${copy.featuredYear}</span></div>
      <div class="spec"><strong>${escapeHtml(facts.category)}</strong><span>${copy.featuredFamily}</span></div>
      <div class="spec"><strong>${escapeHtml(facts.country)}</strong><span>${copy.featuredOrigin}</span></div>
    `;
  }
  if (link) link.href = vehicleHref(featured);
};

const renderStats = () => {
  const countries = new Set(state.vehicles.map((vehicle) => vehicle.country).filter(Boolean));
  const years = state.vehicles.map((vehicle) => Number(vehicle.year)).filter(Number.isFinite);
  const minYear = years.length ? Math.min(...years) : 0;

  if (els.stats[0]) {
    els.stats[0].querySelector("strong").textContent = String(state.vehicles.length);
    els.stats[0].querySelector("span").textContent = copy.dynamicFiles;
  }
  if (els.stats[1] && minYear) {
    els.stats[1].querySelector("strong").textContent = String(minYear);
    els.stats[1].querySelector("span").textContent = copy.firstMarker;
  }
  if (els.stats[2]) {
    els.stats[2].querySelector("strong").textContent = String(countries.size);
    els.stats[2].querySelector("span").textContent = copy.origins;
  }

  sourceBadge.textContent = `${copy.source}: ${state.source}`;
};

const renderPagination = (totalPages) => {
  if (!els.paginationPages) return;

  els.paginationPages.innerHTML = "";
  for (let page = 1; page <= totalPages; page += 1) {
    if (totalPages > 7 && Math.abs(page - state.page) > 2 && page !== 1 && page !== totalPages) {
      if (page === 2 || page === totalPages - 1) {
        const gap = document.createElement("span");
        gap.className = "pagination-gap";
        gap.textContent = "...";
        els.paginationPages.appendChild(gap);
      }
      continue;
    }

    const button = document.createElement("button");
    button.className = "pagination-page";
    button.type = "button";
    button.dataset.page = String(page);
    button.textContent = String(page);
    if (page === state.page) button.setAttribute("aria-current", "page");
    els.paginationPages.appendChild(button);
  }

  if (els.prev) els.prev.disabled = state.page === 1;
  if (els.next) els.next.disabled = state.page === totalPages;
};

const renderCollection = (shouldScroll = false) => {
  const results = filteredVehicles();
  const totalPages = Math.max(1, Math.ceil(results.length / pageSize));
  state.page = Math.min(state.page, totalPages);

  const start = (state.page - 1) * pageSize;
  const pageItems = results.slice(start, start + pageSize);

  els.grid.innerHTML = "";
  pageItems.forEach((vehicle) => els.grid.appendChild(createIntegratedVehicleCard(vehicle)));
  emptyState.hidden = results.length !== 0;

  if (els.paginationStatus) {
    const categoryText = state.selectedCategories.size ? ` · ${copy.filters}: ${state.selectedCategories.size}` : "";
    const queryText = state.query ? ` · ${copy.query}: "${state.query}"` : "";
    els.paginationStatus.textContent = results.length
      ? `Véhicules ${start + 1}-${Math.min(start + pageSize, results.length)} sur ${results.length}${categoryText}${queryText}`
      : "Aucun véhicule dans ce filtre";
  }

  renderPagination(totalPages);
  writeUrlState();

  if (shouldScroll) {
    document.querySelector("#collection-grid")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
};

const bindEvents = () => {
  searchInput.addEventListener("input", () => {
    state.query = searchInput.value.trim();
    state.page = 1;
    renderCollection();
  });

  sortSelect.addEventListener("change", () => {
    state.sort = sortSelect.value;
    state.page = 1;
    renderCollection();
  });

  els.filterBar?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-filter]");
    if (!button) return;

    const slug = button.dataset.filter;
    if (slug === "all") {
      state.selectedCategories.clear();
    } else if (state.selectedCategories.has(slug)) {
      state.selectedCategories.delete(slug);
    } else {
      state.selectedCategories.add(slug);
    }

    state.page = 1;
    renderFilters();
    renderCollection(true);
  });

  els.paginationPages?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-page]");
    if (!button) return;
    state.page = Number(button.dataset.page);
    renderCollection(true);
  });

  els.prev?.addEventListener("click", () => {
    state.page = Math.max(1, state.page - 1);
    renderCollection(true);
  });

  els.next?.addEventListener("click", () => {
    const totalPages = Math.max(1, Math.ceil(filteredVehicles().length / pageSize));
    state.page = Math.min(totalPages, state.page + 1);
    renderCollection(true);
  });

  window.addEventListener("popstate", () => {
    readUrlState();
    renderFilters();
    renderCollection();
  });
};

const init = async () => {
  if (!els.grid) return;

  readUrlState();
  const data = await loadCollectionData();
  state.vehicles = data.vehicles;
  state.categories = data.categories;
  state.categoryBySlug = new Map(data.categories.map((category) => [category.slug, category]));
  state.source = data.source;

  renderStats();
  renderFeature();
  renderFilters();
  bindEvents();
  renderCollection();
};

init().catch((error) => {
  console.error(error);
  if (els.paginationStatus) els.paginationStatus.textContent = "Impossible de charger la collection dynamique.";
});
