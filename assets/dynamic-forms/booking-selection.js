import {
  audienceContent,
  audienceLabels,
  escapeHtml,
  loadCommerceData,
  money,
  normalizeAudience
} from "../dynamic-commerce/commerce-service.js";

const legacyTypeForAudience = {
  individual: "individuel",
  family: "famille",
  school: "scolaire",
  corporate: "corporate",
  garage: "garage",
  member: "membre"
};

const params = new URLSearchParams(window.location.search);
const requestedType = params.get("type") || "individuel";
const audience = normalizeAudience(requestedType);
const urlType = legacyTypeForAudience[audience] || requestedType;

const panels = document.querySelectorAll(".booking-panel");
const dateGrid = document.querySelector(".date-grid");
const slotGrid = document.querySelector(".slot-grid");
const ticketPanel = panels[2];
const optionGrid = document.querySelector(".option-grid");
const continueBooking = document.querySelector("#continueBooking");

const summary = () => ({
  formula: document.querySelector("#summaryFormula"),
  date: document.querySelector("#summaryDate"),
  slot: document.querySelector("#summarySlot"),
  tickets: document.querySelector("#summaryTickets"),
  options: document.querySelector("#summaryOptions"),
  subtotal: document.querySelector("#summarySubtotal"),
  total: document.querySelector("#summaryTotal")
});

const timeLabel = (value) => String(value || "")
  .slice(0, 5)
  .replace(":", "h");

const dateObject = (isoDate) => new Date(`${isoDate}T12:00:00`);

const dateLabel = (isoDate, withYear = false) => {
  const options = { weekday: "long", day: "2-digit", month: "long" };
  if (withYear) options.year = "numeric";
  const label = new Intl.DateTimeFormat("fr-FR", options).format(dateObject(isoDate));
  return label.charAt(0).toUpperCase() + label.slice(1);
};

const shortDateParts = (isoDate) => {
  const date = dateObject(isoDate);
  const weekday = new Intl.DateTimeFormat("fr-FR", { weekday: "short" }).format(date).replace(".", "");
  const day = new Intl.DateTimeFormat("fr-FR", { day: "2-digit" }).format(date);
  const month = new Intl.DateTimeFormat("fr-FR", { month: "short" }).format(date).replace(".", "");

  return {
    strong: `${weekday.charAt(0).toUpperCase()}${weekday.slice(1)} ${day}`,
    span: `${month} · disponible`
  };
};

const uniqueDates = (slots) => [...new Set(slots.map((slot) => slot.date))].sort();

const relevantSlots = (slots) => {
  const today = new Date().toISOString().slice(0, 10);
  return slots
    .filter((slot) => slot.date >= today)
    .filter((slot) => !["sold_out", "closed"].includes(slot.status))
    .filter((slot) => !slot.audiences?.length || slot.audiences.includes(audience))
    .sort((a, b) => `${a.date} ${a.startsAt}`.localeCompare(`${b.date} ${b.startsAt}`));
};

const renderHero = (tickets, slots) => {
  const content = audienceContent[audience] || audienceContent.individual;
  const label = audienceLabels[audience] || "Visite individuelle";
  const minPrice = tickets.length ? Math.min(...tickets.map((ticket) => ticket.price)) : 0;
  const maxDuration = tickets.length ? Math.max(...tickets.map((ticket) => ticket.durationMinutes || 0)) : 90;

  document.title = `${label} | Musée de l’Automobile du Maroc`;
  document.querySelector("#page-title").textContent = content.title;
  document.querySelector(".hero-copy").textContent = content.copy;
  document.querySelector(".hero-stats").innerHTML = `
    <div class="stat"><strong>${escapeHtml(label.split(" ")[0])}</strong><span>${escapeHtml(label)}</span></div>
    <div class="stat"><strong>Dès ${money(minPrice)}</strong><span>Tarif public</span></div>
    <div class="stat"><strong>${maxDuration} min</strong><span>${slots.length} créneaux ouverts</span></div>
  `;

  const formula = summary().formula;
  if (formula) formula.textContent = label;
};

const renderTickets = (tickets) => {
  if (!ticketPanel || !tickets.length) return;

  ticketPanel.innerHTML = `
    <h2 class="panel-title">3. Billets</h2>
    <div id="ticketRows">
      ${tickets.map((ticket) => `
        <div class="ticket-row" data-ticket="${escapeHtml(ticket.name)}" data-price="${ticket.price}" data-min="${ticket.minimumQuantity}" data-max="${ticket.maximumQuantity ?? ""}">
          <div>
            <h3>${escapeHtml(ticket.name)}</h3>
            <p><span class="ticket-price">${escapeHtml(money(ticket.price, ticket.currency))}</span>${escapeHtml(ticket.description)}</p>
          </div>
          <div class="stepper">
            <button type="button" data-step="-1" aria-label="Retirer ${escapeHtml(ticket.name)}">−</button>
            <output>${ticket.defaultQuantity}</output>
            <button type="button" data-step="1" aria-label="Ajouter ${escapeHtml(ticket.name)}">+</button>
          </div>
        </div>
      `).join("")}
    </div>
  `;
};

const renderOptions = (options) => {
  if (!optionGrid) return;

  optionGrid.innerHTML = options.map((option) => `
    <button class="option-card${option.defaultSelected ? " is-selected" : ""}" type="button" data-value="${escapeHtml(option.name)}" data-price="${option.price}">
      <strong>${escapeHtml(option.name)}</strong>
      <span>${escapeHtml(option.price ? `${option.description} · +${money(option.price)}` : option.description)}</span>
    </button>
  `).join("");
};

const renderDates = (slots) => {
  if (!dateGrid) return null;
  const dates = uniqueDates(slots);

  dateGrid.innerHTML = dates.map((date, index) => {
    const parts = shortDateParts(date);
    return `
      <button class="date-btn${index === 0 ? " is-selected" : ""}" type="button" data-value="${escapeHtml(dateLabel(date))}" data-iso="${date}">
        <strong>${escapeHtml(parts.strong)}</strong>
        <span>${escapeHtml(parts.span)}</span>
      </button>
    `;
  }).join("");

  return dates[0] || null;
};

const renderSlots = (slots, selectedDate) => {
  if (!slotGrid) return;
  const slotsForDate = slots.filter((slot) => slot.date === selectedDate);

  slotGrid.innerHTML = slotsForDate.map((slot, index) => {
    const placesLeft = Math.max(0, slot.capacity - slot.reservedCount);
    const status = slot.status === "limited" || placesLeft <= 5 ? `${placesLeft} places` : "Disponible";
    return `
      <button class="slot-btn${index === 0 ? " is-selected" : ""}" type="button" data-value="${escapeHtml(timeLabel(slot.startsAt))}" data-slot-id="${escapeHtml(slot.id)}">
        <strong>${escapeHtml(timeLabel(slot.startsAt))}</strong>
        <span>${escapeHtml(slot.title || status)} · ${escapeHtml(status)}</span>
      </button>
    `;
  }).join("");

  const selected = slotGrid.querySelector(".slot-btn.is-selected");
  const currentSummary = summary();
  if (selected && currentSummary.slot) currentSummary.slot.textContent = selected.dataset.value;
};

const selectedTicketRows = () => [...document.querySelectorAll(".ticket-row")].map((row) => {
  const quantity = Number(row.querySelector("output")?.textContent || 0);
  return {
    name: row.dataset.ticket,
    unitPrice: Number(row.dataset.price || 0),
    quantity
  };
});

const selectedOptions = () => [...document.querySelectorAll(".option-card.is-selected")].map((option) => ({
  name: option.dataset.value,
  unitPrice: Number(option.dataset.price || 0),
  quantity: Number(option.dataset.price || 0) > 0 ? 1 : 0
}));

const collectLineItems = () => [
  ...selectedTicketRows().filter((item) => item.quantity > 0),
  ...selectedOptions().filter((item) => item.quantity > 0)
];

const updateSummary = () => {
  const currentSummary = summary();
  const selectedTickets = selectedTicketRows().filter((item) => item.quantity > 0);
  const optionNames = selectedOptions().map((item) => item.name).filter(Boolean);
  const lineItems = collectLineItems();
  const ticketCount = selectedTickets.reduce((sum, item) => sum + item.quantity, 0);
  const amount = lineItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const selectedDate = document.querySelector(".date-btn.is-selected");

  if (currentSummary.date && selectedDate) currentSummary.date.textContent = selectedDate.dataset.value;
  if (currentSummary.tickets) {
    currentSummary.tickets.textContent = selectedTickets.length
      ? selectedTickets.map((item) => `${item.quantity} ${item.name}`).join(", ")
      : "Aucun billet";
  }
  if (currentSummary.options) currentSummary.options.textContent = optionNames.length ? optionNames.join(", ") : "Aucune option";
  if (currentSummary.subtotal) currentSummary.subtotal.textContent = money(amount);
  if (currentSummary.total) currentSummary.total.textContent = money(amount);

  if (continueBooking) {
    const url = new URL("coordonnees.html", window.location.href);
    url.searchParams.set("type", urlType);
    url.searchParams.set("amount", String(amount));
    url.searchParams.set("tickets", String(ticketCount));
    if (selectedDate?.dataset.iso) url.searchParams.set("date", selectedDate.dataset.iso);
    if (currentSummary.slot?.textContent) url.searchParams.set("slot", currentSummary.slot.textContent.trim());
    continueBooking.href = `${url.pathname}${url.search}`;
  }
};

const collectDraft = () => {
  const currentSummary = summary();
  const selectedDate = document.querySelector(".date-btn.is-selected");
  const selectedOptionNames = selectedOptions().map((item) => item.name).filter(Boolean);
  const selectedTickets = selectedTicketRows().filter((item) => item.quantity > 0);
  const lineItems = collectLineItems();
  const ticketCount = selectedTickets.reduce((sum, item) => sum + item.quantity, 0);
  const amount = lineItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

  return {
    createdAt: new Date().toISOString(),
    type: urlType,
    audience,
    formula: currentSummary.formula?.textContent?.trim() || audienceLabels[audience],
    visitDate: selectedDate?.dataset.iso || new Date().toISOString().slice(0, 10),
    visitDateLabel: currentSummary.date?.textContent?.trim() || selectedDate?.dataset.value || "Date à confirmer",
    visitSlot: currentSummary.slot?.textContent?.trim() || "10h00",
    options: selectedOptionNames,
    optionsLabel: currentSummary.options?.textContent?.trim() || selectedOptionNames.join(", "),
    lineItems,
    ticketCount,
    amount
  };
};

const bindEvents = (slots) => {
  dateGrid?.addEventListener("click", (event) => {
    const button = event.target.closest(".date-btn");
    if (!button) return;
    dateGrid.querySelectorAll(".date-btn").forEach((item) => item.classList.remove("is-selected"));
    button.classList.add("is-selected");
    renderSlots(slots, button.dataset.iso);
    updateSummary();
  });

  slotGrid?.addEventListener("click", (event) => {
    const button = event.target.closest(".slot-btn");
    if (!button) return;
    slotGrid.querySelectorAll(".slot-btn").forEach((item) => item.classList.remove("is-selected"));
    button.classList.add("is-selected");
    const currentSummary = summary();
    if (currentSummary.slot) currentSummary.slot.textContent = button.dataset.value;
    updateSummary();
  });

  ticketPanel?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-step]");
    if (!button) return;
    const row = button.closest(".ticket-row");
    const output = row.querySelector("output");
    const min = Number(row.dataset.min || 0);
    const max = row.dataset.max ? Number(row.dataset.max) : 999;
    const next = Math.min(max, Math.max(min, Number(output.textContent || 0) + Number(button.dataset.step)));
    output.textContent = String(next);
    updateSummary();
  });

  optionGrid?.addEventListener("click", (event) => {
    const button = event.target.closest(".option-card");
    if (!button) return;
    button.classList.toggle("is-selected");
    updateSummary();
  });

  continueBooking?.addEventListener("click", () => {
    sessionStorage.setItem("camBookingDraft", JSON.stringify(collectDraft()));
    updateSummary();
  });
};

const init = async () => {
  const commerce = await loadCommerceData();
  const tickets = commerce.ticketTypes.filter((ticket) => ticket.audience === audience);
  const options = commerce.bookingOptions.filter((option) => option.audience === "all" || option.audience === audience);
  const slots = relevantSlots(commerce.visitSlots);
  const selectedDate = renderDates(slots);

  renderHero(tickets, slots);
  renderTickets(tickets);
  renderOptions(options);
  renderSlots(slots, selectedDate);
  updateSummary();
  bindEvents(slots);

  const title = document.querySelector(".summary-panel h2");
  if (title && !document.querySelector(".commerce-source")) {
    title.insertAdjacentHTML("afterend", `<span class="commerce-source">Source: ${escapeHtml(commerce.source)}</span>`);
  }
};

init().catch((error) => {
  console.error(error);
  const panel = document.querySelector(".summary-panel");
  panel?.insertAdjacentHTML("beforeend", `<p class="commerce-empty">Impossible de charger les tarifs dynamiques.</p>`);
});
