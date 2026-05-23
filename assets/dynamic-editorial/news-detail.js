import {
  escapeAttribute,
  escapeHtml,
  formatDate,
  imageUrl,
  loadEditorialData,
  newsCategoryLabels,
  newsHref
} from "./editorial-service.js";

const params = new URLSearchParams(window.location.search);
const requestedSlug = params.get("slug");

const paragraphs = (text) => String(text || "")
  .split(/\n{2,}/)
  .map((part) => part.trim())
  .filter(Boolean);

const renderDetail = (article, articles) => {
  const category = newsCategoryLabels[article.category] || "Actualité";
  document.title = `${article.title} | Musée de l'Automobile du Maroc`;

  const hero = document.querySelector(".hero");
  if (hero && imageUrl(article)) {
    hero.style.backgroundImage = `linear-gradient(90deg, rgba(0,0,0,.9), rgba(0,0,0,.56) 48%, rgba(0,0,0,.2)), linear-gradient(0deg, #0b0b0b 0%, rgba(11,11,11,.12) 36%), url('${imageUrl(article)}')`;
  }

  document.querySelector(".hero .eyebrow").textContent = category;
  document.querySelector("#page-title").textContent = article.title;
  document.querySelector(".hero-copy").textContent = article.excerpt;

  const stats = document.querySelectorAll(".hero-stats .stat");
  if (stats[0]) {
    stats[0].querySelector("strong").textContent = formatDate(article.publishedDate, { withYear: true });
    stats[0].querySelector("span").textContent = "publication";
  }
  if (stats[1]) {
    stats[1].querySelector("strong").textContent = category;
    stats[1].querySelector("span").textContent = "rubrique";
  }
  if (stats[2]) {
    stats[2].querySelector("strong").textContent = article.author || "CAM";
    stats[2].querySelector("span").textContent = "source";
  }

  const detailGrid = document.querySelector(".detail-grid");
  if (detailGrid) {
    detailGrid.innerHTML = `
      <aside class="detail-panel reveal is-visible">
        <span class="eyebrow">Fiche communiqué</span>
        <ul class="detail-list">
          <li><strong>Date</strong><br>${escapeHtml(formatDate(article.publishedDate, { withYear: true }))}</li>
          <li><strong>Rubrique</strong><br>${escapeHtml(category)}</li>
          <li><strong>Auteur</strong><br>${escapeHtml(article.author || "Musée de l'Automobile du Maroc")}</li>
          <li><strong>Contact presse</strong><br>contact@museeautomobile.ma</li>
        </ul>
        <div class="hero-actions">
          <a class="btn btn-secondary" href="actualites.html">Retour actualités</a>
        </div>
      </aside>
      <article class="detail-panel detail-article reveal is-visible">
        <span class="eyebrow">Communiqué</span>
        <h2 class="section-title">${escapeHtml(article.title)}</h2>
        ${paragraphs(article.body || article.excerpt).map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("")}
      </article>
    `;
  }

  const related = articles.filter((candidate) => candidate.slug !== article.slug).slice(0, 3);
  const relatedGrid = document.querySelector(".news-grid");
  if (relatedGrid) {
    relatedGrid.innerHTML = related.map((candidate) => `
      <article class="news-card reveal is-visible">
        <img class="news-image" src="${escapeAttribute(imageUrl(candidate))}" alt="${escapeAttribute(candidate.title)}" loading="lazy">
        <div class="news-content">
          <div class="news-meta"><span>${escapeHtml(newsCategoryLabels[candidate.category] || "Actualité")}</span><span>${escapeHtml(formatDate(candidate.publishedDate))}</span></div>
          <h3>${escapeHtml(candidate.title)}</h3>
          <p>${escapeHtml(candidate.excerpt)}</p>
          <a class="btn btn-secondary" href="${escapeAttribute(newsHref(candidate))}">Lire</a>
        </div>
      </article>
    `).join("");
  }
};

const init = async () => {
  const data = await loadEditorialData();
  const articles = data.news.sort((a, b) => String(b.publishedDate || "").localeCompare(String(a.publishedDate || "")));
  const article = articles.find((item) => item.slug === requestedSlug) || articles.find((item) => item.isFeatured) || articles[0];
  if (!article) return;
  renderDetail(article, articles);
};

init().catch((error) => {
  console.error(error);
});
