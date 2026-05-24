(function () {
  const translatedPages = new Set([
    "index-en.html",
    "collection-en.html",
    "garage-en.html",
    "horaires-en.html",
    "tickets-en.html",
    "demande-devis-en.html"
  ]);

  const currentPath = window.location.pathname.split("/").pop() || "index.html";
  const isEnglish = /-en\.html$/i.test(currentPath);
  const basePage = isEnglish ? currentPath.replace(/-en\.html$/i, ".html") : currentPath;
  const translatedPage = basePage.replace(/\.html$/i, "-en.html");
  const hasEnglishVersion = translatedPages.has(translatedPage);

  const links = {
    fr: hasEnglishVersion ? (isEnglish ? basePage : currentPath) : "index.html",
    en: hasEnglishVersion ? translatedPage : "index-en.html"
  };

  const labels = isEnglish
    ? {
        menu: "Language switcher",
        fr: "French version",
        en: "English version"
      }
    : {
        menu: "Sélecteur de langue",
        fr: "Version française",
        en: "Version anglaise"
      };

  const switcherMarkup = [
    '<div class="lang-switcher" aria-label="' + labels.menu + '">',
    '<a class="' + (isEnglish ? "" : "is-active") + '" href="' + links.fr + '" lang="fr" hreflang="fr" aria-label="' + labels.fr + '">FR</a>',
    '<a class="' + (isEnglish ? "is-active" : "") + '" href="' + links.en + '" lang="en" hreflang="en" aria-label="' + labels.en + '">EN</a>',
    "</div>"
  ].join("");

  const injectInHeader = () => {
    const ctaSlot = document.querySelector(".nav-ctas, .nav-actions");
    if (ctaSlot && !ctaSlot.querySelector(".lang-switcher")) {
      ctaSlot.insertAdjacentHTML("afterbegin", switcherMarkup);
      return;
    }

    const wrap = document.querySelector(".nav-wrap");
    const toggle = document.querySelector(".menu-toggle");
    if (wrap && toggle && !wrap.querySelector(".lang-switcher")) {
      toggle.insertAdjacentHTML("beforebegin", switcherMarkup);
    }
  };

  const injectInMobile = () => {
    const mobileCtas = document.querySelector(".mobile-ctas");
    if (mobileCtas && !mobileCtas.querySelector(".lang-switcher")) {
      mobileCtas.insertAdjacentHTML("afterbegin", switcherMarkup);
      return;
    }

    const mobilePanel = document.querySelector(".mobile-panel");
    if (mobilePanel && !mobilePanel.querySelector(".lang-switcher")) {
      mobilePanel.insertAdjacentHTML("beforeend", switcherMarkup);
    }
  };

  const patchFooterLanguages = () => {
    document.querySelectorAll(".languages").forEach((node) => {
      node.setAttribute("aria-label", labels.menu);
      node.innerHTML = switcherMarkup;
    });
  };

  injectInHeader();
  injectInMobile();
  patchFooterLanguages();
})();
