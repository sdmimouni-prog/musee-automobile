import {
  escapeAttribute,
  escapeHtml,
  formatDate,
  imageUrl,
  loadEditorialData,
  newsCategoryLabels,
  newsHref
} from "./editorial-service.js";

const els = {
  featured: document.querySelector(".featured-story"),
  slider: document.querySelector("#newsSlider"),
  sliderShell: document.querySelector(".news-slider-shell"),
  stats: document.querySelectorAll(".hero-stats .stat"),
  sectionHead: document.querySelector(".feature-band .section-head"),
  hero: document.querySelector(".hero")
};

const state = {
  articles: [],
  source: "JSON",
  category: "all",
  query: ""
};

const controls = document.createElement("div");
controls.className = "editorial-tools reveal is-visible";
controls.innerHTML = `
  <input class="editorial-search" type="search" placeholder="Rechercher une actualité...">
  <button class="filter-pill" type="button" data-category="all" aria-pressed="true">Tous</button>
  <button class="filter-pill" type="button" data-category="news" aria-pressed="false">Actualités</button>
  <button class="filter-pill" type="button" data-category="press" aria-pressed="false">Communiqués</button>
  <button class="filter-pill" type="button" data-category="media" aria-pressed="false">Médias</button>
  <button class="filter-pill" type="button" data-category="community" aria-pressed="false">Communauté</button>
  <span class="editorial-source">Source: JSON</span>
`;

const empty = document.createElement("div");
empty.className = "editorial-empty";
empty.hidden = true;
empty.textContent = "Aucune actualité ne correspond à cette recherche.";

els.sectionHead?.after(controls);
els.sliderShell?.after(empty);

const searchInput = controls.querySelector(".editorial-search");
const sourceBadge = controls.querySelector(".editorial-source");

const categoryText = (article) => newsCategoryLabels[article.category] || "Actualité";

const renderFeatured = () => {
  const featured = state.articles.find((article) => article.isFeatured) || state.articles[0];
  if (!featured || !els.featured) return;

  els.featured.style.setProperty("--feature-image", `url('${imageUrl(featured)}')`);
  els.featured.innerHTML = `
    <div>
      <span class="eyebrow">À la une · ${escapeHtml(categoryText(featured))}</span>
      <h2>${escapeHtml(featured.title)}</h2>
      <p>${escapeHtml(featured.excerpt)}</p>
      <div class="hero-actions">
        <a class="btn btn-primary" href="${newsHref(featured)}">Lire le dossier</a>
        <a class="btn btn-secondary" href="agenda.html">Voir l'agenda</a>
      </div>
    </div>
  `;

  if (els.hero && imageUrl(featured)) {
    els.hero.style.backgroundImage = `linear-gradient(90deg, rgba(0,0,0,.9), rgba(0,0,0,.56) 48%, rgba(0,0,0,.2)), linear-gradient(0deg, #0b0b0b 0%, rgba(11,11,11,.12) 36%), url('${imageUrl(featured)}')`;
  }
};

const articleMatches = (article) => {
  const categoryMatch = state.category === "all" || article.category === state.category;
  if (!categoryMatch) return false;
  const query = state.query.trim().toLowerCase();
  if (!query) return true;
  return [article.title, article.excerpt, article.body, categoryText(article), article.author]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .includes(query);
};

const createCard = (article) => {
  const card = document.createElement("article");
  card.className = "news-card reveal is-visible";
  card.innerHTML = `
    <img class="news-image" src="${escapeAttribute(imageUrl(article))}" alt="${escapeAttribute(article.title)}" loading="lazy">
    <div class="news-content">
      <div class="news-meta">
        <span>${escapeHtml(categoryText(article))}</span>
        <span>${escapeHtml(formatDate(article.publishedDate))}</span>
      </div>
      <h3>${escapeHtml(article.title)}</h3>
      <p>${escapeHtml(article.excerpt)}</p>
      <a class="btn btn-secondary" href="${newsHref(article)}">Lire</a>
    </div>
  `;
  return card;
};

const renderStats = () => {
  const categories = new Set(state.articles.map((article) => article.category).filter(Boolean));
  const latest = state.articles
    .map((article) => article.publishedDate)
    .filter(Boolean)
    .sort()
    .at(-1);

  if (els.stats[0]) {
    els.stats[0].querySelector("strong").textContent = String(state.articles.length);
    els.stats[0].querySelector("span").textContent = "publications";
  }
  if (els.stats[1]) {
    els.stats[1].querySelector("strong").textContent = latest ? formatDate(latest) : "À jour";
    els.stats[1].querySelector("span").textContent = "dernière mise à jour";
  }
  if (els.stats[2]) {
    els.stats[2].querySelector("strong").textContent = String(categories.size);
    els.stats[2].querySelector("span").textContent = "rubriques";
  }
  sourceBadge.textContent = `Source: ${state.source}`;
};

const renderList = () => {
  const items = state.articles.filter(articleMatches);
  els.slider.innerHTML = "";
  els.slider.classList.add("is-grid");
  items.forEach((article) => els.slider.appendChild(createCard(article)));
  empty.hidden = items.length !== 0;
};

const bindEvents = () => {
  searchInput.addEventListener("input", () => {
    state.query = searchInput.value.trim();
    renderList();
  });

  controls.addEventListener("click", (event) => {
    const button = event.target.closest("[data-category]");
    if (!button) return;

    state.category = button.dataset.category;
    controls.querySelectorAll("[data-category]").forEach((candidate) => {
      candidate.setAttribute("aria-pressed", String(candidate === button));
    });
    renderList();
  });
};

const init = async () => {
  if (!els.slider) return;
  const data = await loadEditorialData();
  state.articles = data.news.sort((a, b) => String(b.publishedDate || "").localeCompare(String(a.publishedDate || "")));
  state.source = data.source;
  renderStats();
  renderFeatured();
  renderList();
  bindEvents();
};

init().catch((error) => {
  console.error(error);
  empty.hidden = false;
  empty.textContent = "Impossible de charger les actualités dynamiques.";
});
