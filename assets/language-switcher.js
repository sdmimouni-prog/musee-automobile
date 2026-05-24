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

  const englishHrefMap = new Map([
    ["index.html", "index-en.html"],
    ["index.html#top", "index-en.html#top"],
    ["index.html#hero", "index-en.html#hero"],
    ["index.html#news", "index-en.html#news"],
    ["collection.html", "collection-en.html"],
    ["garage.html", "garage-en.html"],
    ["horaires.html", "horaires-en.html"],
    ["tickets.html", "tickets-en.html"],
    ["demande-devis.html", "demande-devis-en.html"],
    ["club.html", "index-en.html#mot-president-home"],
    ["mot-president.html", "index-en.html#mot-president-home"],
    ["partenaires.html", "index-en.html#univers"],
    ["devenir-membre.html", "index-en.html#univers"],
    ["espace-membres.html", "index-en.html#univers"],
    ["automotive-academy.html", "index-en.html#univers"],
    ["programmes.html", "index-en.html#univers"],
    ["timeline.html", "collection-en.html"],
    ["batiment-histoire.html", "collection-en.html"],
    ["visites-scolaires.html", "tickets-en.html"],
    ["evenementiel.html", "demande-devis-en.html"],
    ["espaces-evenementiels.html", "demande-devis-en.html"],
    ["parc-automobile.html", "demande-devis-en.html"],
    ["terrasse-evenementielle.html", "demande-devis-en.html"],
    ["seminaires-conferences.html", "demande-devis-en.html"],
    ["professionnels-b2b.html", "demande-devis-en.html"],
    ["team-building.html", "demande-devis-en.html"],
    ["services-evenementiels.html", "demande-devis-en.html"],
    ["dossier-evenementiel.html", "demande-devis-en.html"],
    ["mariages-receptions.html", "demande-devis-en.html"],
    ["anniversaires-galas.html", "demande-devis-en.html"],
    ["garage-carte.html", "garage-en.html"],
    ["garage-cuisine.html", "garage-en.html"],
    ["garage-chefs.html", "garage-en.html"],
    ["garage-temps-forts.html", "garage-en.html"],
    ["garage-reservation.html", "garage-en.html"],
    ["actualites.html", "index-en.html#news"],
    ["communique-detail.html", "index-en.html#news"],
    ["agenda.html", "index-en.html#news"],
    ["presse-media.html", "index-en.html#news"],
    ["videos-galerie.html", "index-en.html#news"],
    ["instagram.html", "index-en.html#news"],
    ["cars-coffee.html", "index-en.html#news"]
  ]);

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

  const patchEnglishNavigationLinks = () => {
    if (!isEnglish) return;

    document.querySelectorAll('a[href]').forEach((link) => {
      const href = link.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("http://") || href.startsWith("https://") || href.startsWith("mailto:") || href.startsWith("tel:")) {
        return;
      }

      if (englishHrefMap.has(href)) {
        link.setAttribute("href", englishHrefMap.get(href));
        return;
      }

      const [path, hash = ""] = href.split("#");
      const mapped = englishHrefMap.get(path);
      if (!mapped) return;

      if (mapped.includes("#") || !hash) {
        link.setAttribute("href", mapped);
        return;
      }

      link.setAttribute("href", `${mapped}#${hash}`);
    });
  };

  injectInHeader();
  injectInMobile();
  patchFooterLanguages();
  patchEnglishNavigationLinks();
})();
