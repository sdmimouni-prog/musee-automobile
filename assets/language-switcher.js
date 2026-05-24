(function () {
  const translatedPages = new Set([
    "index-en.html",
    "collection-en.html",
    "garage-en.html",
    "horaires-en.html",
    "tickets-en.html",
    "demande-devis-en.html",
    "club-en.html",
    "mot-president-en.html",
    "partenaires-en.html",
    "devenir-membre-en.html",
    "espace-membres-en.html",
    "automotive-academy-en.html",
    "programmes-en.html",
    "timeline-en.html",
    "batiment-histoire-en.html",
    "visites-scolaires-en.html",
    "evenementiel-en.html",
    "espaces-evenementiels-en.html",
    "parc-automobile-en.html",
    "terrasse-evenementielle-en.html",
    "seminaires-conferences-en.html",
    "professionnels-b2b-en.html",
    "team-building-en.html",
    "services-evenementiels-en.html",
    "dossier-evenementiel-en.html",
    "mariages-receptions-en.html",
    "anniversaires-galas-en.html"
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
    ["club.html", "club-en.html"],
    ["mot-president.html", "mot-president-en.html"],
    ["partenaires.html", "partenaires-en.html"],
    ["devenir-membre.html", "devenir-membre-en.html"],
    ["espace-membres.html", "espace-membres-en.html"],
    ["automotive-academy.html", "automotive-academy-en.html"],
    ["programmes.html", "programmes-en.html"],
    ["timeline.html", "timeline-en.html"],
    ["batiment-histoire.html", "batiment-histoire-en.html"],
    ["visites-scolaires.html", "visites-scolaires-en.html"],
    ["evenementiel.html", "evenementiel-en.html"],
    ["espaces-evenementiels.html", "espaces-evenementiels-en.html"],
    ["parc-automobile.html", "parc-automobile-en.html"],
    ["terrasse-evenementielle.html", "terrasse-evenementielle-en.html"],
    ["seminaires-conferences.html", "seminaires-conferences-en.html"],
    ["professionnels-b2b.html", "professionnels-b2b-en.html"],
    ["team-building.html", "team-building-en.html"],
    ["services-evenementiels.html", "services-evenementiels-en.html"],
    ["dossier-evenementiel.html", "dossier-evenementiel-en.html"],
    ["mariages-receptions.html", "mariages-receptions-en.html"],
    ["anniversaires-galas.html", "anniversaires-galas-en.html"],
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
      if (link.closest('.brand, .lang-switcher, .languages')) return;

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

  const patchEnglishChrome = () => {
    if (!isEnglish) return;

    document.querySelectorAll(".desktop-nav").forEach((nav) => {
      nav.setAttribute("aria-label", "Main navigation");
    });

    document.querySelectorAll(".mobile-panel").forEach((panel) => {
      panel.setAttribute("aria-label", "Mobile menu");
    });

    const buttonLabels = new Map([
      ["À propos", "About"],
      ["Le Musée", "The Museum"],
      ["Événementiel", "Events"],
      ["Actualité", "News"],
      ["Billetterie", "Tickets"],
      ["Ouvrir le menu", "Open menu"],
      ["Fermer le menu", "Close menu"]
    ]);

    document.querySelectorAll("button").forEach((button) => {
      const text = button.textContent.trim();
      if (buttonLabels.has(text)) {
        button.textContent = buttonLabels.get(text);
      }

      const ariaLabel = button.getAttribute("aria-label");
      if (ariaLabel && buttonLabels.has(ariaLabel)) {
        button.setAttribute("aria-label", buttonLabels.get(ariaLabel));
      }
    });

    const headingLabels = new Map([
      ["Adhésion", "Membership"],
      ["Découvrir", "Discover"],
      ["Visiter", "Visit"],
      ["Expositions", "Exhibitions"],
      ["Espaces", "Spaces"],
      ["Entreprises", "Corporate"],
      ["Privé", "Private"],
      ["Équipe", "Team"],
      ["Infos", "Information"],
      ["Contenus", "Stories"],
      ["Média", "Media"],
      ["Communauté", "Community"],
      ["Acheter", "Buy"],
      ["Groupes", "Groups"],
      ["Visiter", "Visit"],
      ["Informations", "Information"],
      ["Navigation", "Navigation"]
    ]);

    document.querySelectorAll("h3").forEach((heading) => {
      const text = heading.textContent.trim();
      if (headingLabels.has(text)) {
        heading.textContent = headingLabels.get(text);
      }
    });

    const anchorLabels = new Map([
      ["index-en.html", { label: "Home" }],
      ["club-en.html", { label: "Our story", subtitle: "History & vision" }],
      ["mot-president-en.html", { label: "President's message", subtitle: "Transmission & passion" }],
      ["partenaires-en.html", { label: "Our partners", subtitle: "Institutional & corporate" }],
      ["devenir-membre-en.html", { label: "Become a member", subtitle: "Benefits & memberships" }],
      ["espace-membres-en.html", { label: "Members area", subtitle: "Sign in" }],
      ["automotive-academy-en.html", { label: "Automotive Academy", subtitle: "Training & expertise" }],
      ["programmes-en.html", { label: "Our programmes", subtitle: "Programmes & pathways" }],
      ["collection-en.html", { label: "Collection", subtitle: "Vehicles & exhibitions" }],
      ["garage-en.html", { label: "Le Garage", subtitle: "Concept & experience" }],
      ["horaires-en.html", { label: "Hours & access", subtitle: "Bouskoura Road" }],
      ["tickets-en.html", { label: "Tickets" }],
      ["demande-devis-en.html", { label: "Request a quote", subtitle: "Quick form" }],
      ["timeline.html", { label: "Automotive timeline", subtitle: "Morocco & beyond" }],
      ["timeline-en.html", { label: "Automotive timeline", subtitle: "Morocco & beyond" }],
      ["batiment-histoire.html", { label: "The building & its story", subtitle: "Architecture & heritage" }],
      ["batiment-histoire-en.html", { label: "The building & its story", subtitle: "Architecture & heritage" }],
      ["visites-scolaires.html", { label: "School visits", subtitle: "Educational journey" }],
      ["visites-scolaires-en.html", { label: "School visits", subtitle: "Educational journey" }],
      ["evenementiel.html", { label: "Events" }],
      ["evenementiel-en.html", { label: "Events" }],
      ["espaces-evenementiels.html", { label: "Event rooms", subtitle: "Meetings, galas, conferences" }],
      ["espaces-evenementiels-en.html", { label: "Event rooms", subtitle: "Meetings, galas, conferences" }],
      ["parc-automobile.html", { label: "Vehicle collection", subtitle: "Displays & photo shoots" }],
      ["parc-automobile-en.html", { label: "Vehicle collection", subtitle: "Displays & photo shoots" }],
      ["terrasse-evenementielle.html", { label: "Terrace", subtitle: "Open-air receptions" }],
      ["terrasse-evenementielle-en.html", { label: "Terrace", subtitle: "Open-air receptions" }],
      ["seminaires-conferences.html", { label: "Seminars & conferences", subtitle: "Corporate offer" }],
      ["seminaires-conferences-en.html", { label: "Seminars & conferences", subtitle: "Corporate offer" }],
      ["professionnels-b2b.html", { label: "Professionals & B2B", subtitle: "Conventions, launches, press" }],
      ["professionnels-b2b-en.html", { label: "Professionals & B2B", subtitle: "Conventions, launches, press" }],
      ["team-building.html", { label: "Team building", subtitle: "Bespoke activities" }],
      ["team-building-en.html", { label: "Team building", subtitle: "Bespoke activities" }],
      ["services-evenementiels.html", { label: "Event services", subtitle: "Technical, staging, catering" }],
      ["services-evenementiels-en.html", { label: "Event services", subtitle: "Technical, staging, catering" }],
      ["dossier-evenementiel.html", { label: "Event brochure", subtitle: "Download" }],
      ["dossier-evenementiel-en.html", { label: "Event brochure", subtitle: "Download" }],
      ["mariages-receptions.html", { label: "Weddings & receptions", subtitle: "A unique setting" }],
      ["mariages-receptions-en.html", { label: "Weddings & receptions", subtitle: "A unique setting" }],
      ["anniversaires-galas.html", { label: "Birthdays & galas", subtitle: "Signature moments" }],
      ["anniversaires-galas-en.html", { label: "Birthdays & galas", subtitle: "Signature moments" }],
      ["garage-carte.html", { label: "Menu", subtitle: "Signature menu & desserts" }],
      ["garage-cuisine.html", { label: "Open kitchen", subtitle: "Culinary studio" }],
      ["garage-chefs.html", { label: "The chefs", subtitle: "Vision & transmission" }],
      ["garage-temps-forts.html", { label: "Highlights", subtitle: "Ramadan, cocktails, news" }],
      ["garage-reservation.html", { label: "Book a table", subtitle: "Lunch, dinner, brunch" }],
      ["actualites.html", { label: "News & releases", subtitle: "Latest news" }],
      ["communique-detail.html", { label: "Official release", subtitle: "Editorial template" }],
      ["agenda.html", { label: "Agenda", subtitle: "Upcoming events" }],
      ["presse-media.html", { label: "Press & media", subtitle: "Archive & media kit" }],
      ["videos-galerie.html", { label: "Videos & gallery", subtitle: "Museum moments" }],
      ["instagram.html", { label: "Instagram feed", subtitle: "@museeautomobilemaroc" }],
      ["cars-coffee.html", { label: "Cars & Coffee", subtitle: "Enthusiast gatherings" }],
      ["https://automobilesclub.net/reservation/search", { label: "Buy tickets", subtitle: "Individuals, families, schools" }]
    ]);

    document.querySelectorAll('a[href]').forEach((link) => {
      if (link.closest('.brand, .lang-switcher, .languages')) return;
      if (link.querySelector('img, picture, .brand-mark')) return;
      if (link.closest('.desktop-nav .dropdown, .mobile-panel .mobile-links')) return;

      const href = link.getAttribute("href");
      if (!href) return;

      const [baseHref] = href.split("#");
      const definition = anchorLabels.get(href) || anchorLabels.get(baseHref);
      if (!definition) return;

      const span = link.querySelector("span");
      const icon = link.querySelector("svg");

      if (span) {
        const firstNode = Array.from(link.childNodes).find((node) => node.nodeType === Node.TEXT_NODE);
        if (firstNode) {
          firstNode.textContent = definition.label;
        } else {
          link.insertBefore(document.createTextNode(definition.label), span);
        }
        if (definition.subtitle) span.textContent = definition.subtitle;
        return;
      }

      if (icon) {
        link.innerHTML = `${icon.outerHTML} ${definition.label}`;
        return;
      }

      link.textContent = definition.label;
    });

    document.querySelectorAll('.nav-ctas a.btn-secondary[href], .mobile-ctas a.btn-secondary[href]').forEach((link) => {
      const href = link.getAttribute("href") || "";
      if (href.includes("demande-devis-en.html")) {
        const icon = link.querySelector("svg");
        if (icon) {
          link.innerHTML = `${icon.outerHTML} Private hire`;
        } else {
          link.textContent = "Private hire";
        }
      }
    });
  };

  injectInHeader();
  injectInMobile();
  patchFooterLanguages();
  patchEnglishNavigationLinks();
  patchEnglishChrome();
})();
