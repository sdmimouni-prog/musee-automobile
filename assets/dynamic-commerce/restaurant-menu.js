import {
  escapeHtml,
  loadCommerceData,
  menuCategoryLabels,
  menuCategoryOrder,
  money
} from "./commerce-service.js";

const menuBoard = document.querySelector(".menu-board");
const heroStats = document.querySelector(".hero-stats");

const groupByCategory = (items) => items.reduce((groups, item) => {
  const category = item.category || "main";
  groups[category] = groups[category] || [];
  groups[category].push(item);
  return groups;
}, {});

const categoryPriceRange = (items) => {
  const prices = items.map((item) => item.price).filter((price) => Number.isFinite(price));
  if (!prices.length) return "Sur demande";
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  return min === max ? money(min, "DH") : `${min}-${max} DH`;
};

const renderStats = (items) => {
  if (!heroStats) return;
  const groups = groupByCategory(items);
  const primaryCategories = ["starter", "main", "dessert"];

  heroStats.innerHTML = primaryCategories.map((category) => `
    <div class="stat">
      <strong>${escapeHtml(menuCategoryLabels[category])}</strong>
      <span>${escapeHtml(categoryPriceRange(groups[category] || []))}</span>
    </div>
  `).join("");
};

const renderMenu = (items, source) => {
  if (!menuBoard || !items.length) return;
  const groups = groupByCategory(items);
  const orderedCategories = [
    ...menuCategoryOrder.filter((category) => groups[category]?.length),
    ...Object.keys(groups).filter((category) => !menuCategoryOrder.includes(category))
  ];

  menuBoard.innerHTML = `
    <span class="eyebrow">La carte <span class="commerce-source">Source: ${escapeHtml(source)}</span></span>
    <h2>Menu du Garage.</h2>
    ${orderedCategories.map((category) => `
      <div class="menu-section">
        <span class="menu-category">${escapeHtml(menuCategoryLabels[category] || category)}</span>
        ${groups[category].map((item) => `
          <div class="menu-item">
            <div>
              <strong>${escapeHtml(item.name)}</strong>
              <p>${escapeHtml(item.description)}</p>
              ${(item.tags || []).length ? `<div class="menu-tags">${item.tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}</div>` : ""}
            </div>
            <span class="price">${escapeHtml(item.price === null ? "Sur demande" : money(item.price, "DH"))}</span>
          </div>
        `).join("")}
      </div>
    `).join("")}
  `;
};

const init = async () => {
  const data = await loadCommerceData();
  renderMenu(data.restaurantMenuItems, data.source);
  renderStats(data.restaurantMenuItems);
};

init().catch((error) => {
  console.error(error);
  menuBoard?.insertAdjacentHTML("beforeend", `<p class="commerce-empty">Impossible de charger la carte dynamique.</p>`);
});
