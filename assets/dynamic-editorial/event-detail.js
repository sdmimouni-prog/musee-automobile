import {
  escapeAttribute,
  escapeHtml,
  eventHref,
  eventStatusLabels,
  formatDate,
  imageUrl,
  loadEditorialData
} from "./editorial-service.js";

const params = new URLSearchParams(window.location.search);
const requestedSlug = params.get("slug");

const paragraphs = (text) => String(text || "")
  .split(/\n{2,}/)
  .map((part) => part.trim())
  .filter(Boolean);

const durationLabel = (event) => {
  if (!event.startDate || !event.endDate) return "Durée à confirmer";
  const start = new Date(event.startDate);
  const end = new Date(event.endDate);
  const minutes = Math.max(0, Math.round((end - start) / 60000));
  if (!minutes) return "Durée à confirmer";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours}h${String(rest).padStart(2, "0")}` : `${hours}h`;
};

const renderDetail = (event, events) => {
  document.title = `${event.title} | Musée de l'Automobile du Maroc`;

  const hero = document.querySelector(".hero");
  if (hero && imageUrl(event)) {
    hero.style.backgroundImage = `linear-gradient(90deg, rgba(0,0,0,.9), rgba(0,0,0,.54) 48%, rgba(0,0,0,.16)), linear-gradient(0deg, #0b0b0b 0%, rgba(11,11,11,.12) 36%), url('${imageUrl(event)}')`;
  }

  document.querySelector(".hero .eyebrow").textContent = eventStatusLabels[event.status] || "Détail événement";
  document.querySelector("#page-title").textContent = event.title;
  document.querySelector(".hero-copy").textContent = event.excerpt;

  const stats = document.querySelectorAll(".hero-stats .stat");
  if (stats[0]) {
    stats[0].querySelector("strong").textContent = formatDate(event.startDate);
    stats[0].querySelector("span").textContent = event.startDate ? new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" }).format(new Date(event.startDate)) : "horaire";
  }
  if (stats[1]) {
    stats[1].querySelector("strong").textContent = durationLabel(event);
    stats[1].querySelector("span").textContent = "durée";
  }
  if (stats[2]) {
    stats[2].querySelector("strong").textContent = event.tags?.[0] || "Agenda";
    stats[2].querySelector("span").textContent = "format";
  }

  const actions = document.querySelector(".hero-quickbar .hero-actions");
  if (actions) {
    actions.innerHTML = `
      <a class="btn btn-primary" href="${escapeAttribute(event.bookingUrl || "tickets.html")}">Réserver ma place</a>
      <a class="btn btn-secondary" href="agenda.html">Retour agenda</a>
    `;
  }

  const detailGrid = document.querySelector(".detail-grid");
  if (detailGrid) {
    detailGrid.innerHTML = `
      <aside class="detail-panel reveal is-visible">
        <h3>Informations clés.</h3>
        <ul class="detail-list">
          <li><strong>Date</strong><br>${escapeHtml(formatDate(event.startDate, { withYear: true, withTime: true }))}</li>
          <li><strong>Lieu</strong><br>${escapeHtml(event.venue)}</li>
          <li><strong>Format</strong><br>${escapeHtml((event.tags || []).join(", ") || eventStatusLabels[event.status] || "Événement")}</li>
          <li><strong>Statut</strong><br>${escapeHtml(eventStatusLabels[event.status] || event.status)}</li>
        </ul>
        <div class="hero-actions" style="margin-top:22px">
          <a class="btn btn-primary" href="${escapeAttribute(event.bookingUrl || "tickets.html")}">Réserver</a>
        </div>
      </aside>
      <article class="feature-panel detail-article reveal is-visible">
        <span class="eyebrow">Programme</span>
        <h2>${escapeHtml(event.title)}</h2>
        ${paragraphs(event.description || event.excerpt).map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("")}
      </article>
    `;
  }

  const related = events.filter((candidate) => candidate.slug !== event.slug).slice(0, 3);
  const relatedGrid = document.querySelector(".news-grid");
  if (relatedGrid) {
    relatedGrid.innerHTML = related.map((candidate) => `
      <article class="news-card reveal is-visible">
        <img class="news-image" src="${escapeAttribute(imageUrl(candidate))}" alt="${escapeAttribute(candidate.title)}" loading="lazy">
        <div class="news-content">
          <div class="news-meta"><span>${escapeHtml(candidate.tags?.[0] || "Agenda")}</span><span>${escapeHtml(formatDate(candidate.startDate))}</span></div>
          <h3>${escapeHtml(candidate.title)}</h3>
          <p>${escapeHtml(candidate.excerpt)}</p>
          <a class="btn btn-secondary" href="${escapeAttribute(eventHref(candidate))}">Détails</a>
        </div>
      </article>
    `).join("");
  }
};

const init = async () => {
  const data = await loadEditorialData();
  const events = data.events.sort((a, b) => new Date(a.startDate || 0) - new Date(b.startDate || 0));
  const event = events.find((item) => item.slug === requestedSlug) || events[0];
  if (!event) return;
  renderDetail(event, events);
};

init().catch((error) => {
  console.error(error);
});
