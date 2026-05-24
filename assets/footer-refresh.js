(function () {
  const footer = document.querySelector(".footer");
  if (!footer) return;

  const isEnglish = document.documentElement.lang === "en";
  const page = window.location.pathname.split("/").pop() || "index.html";
  const home = isEnglish ? "index-en.html" : "index.html";
  const collection = isEnglish ? "collection-en.html" : "collection.html";
  const hours = isEnglish ? "horaires-en.html" : "horaires.html";
  const tickets = "https://automobilesclub.net/reservation/search";
  const quote = isEnglish ? "demande-devis-en.html" : "demande-devis.html";
  const garage = isEnglish ? "garage-en.html" : "garage.html";

  const copy = isEnglish
    ? {
        title: "Museum of the Automobile of Morocco",
        intro: "A sober navigation footer to help visitors move across the Museum, collection, events and restaurant ecosystem without getting lost.",
        address: "Route de Bouskoura, Casablanca",
        hours: "Tue-Sun · 10:00-18:00",
        contact: "contact@musee-automobile.ma",
        phone: "+212 600 270 387",
        discover: "Discover",
        visit: "Visit",
        events: "Events & dining",
        resources: "Resources",
        legal: "Legal",
        collection: "Collection",
        history: "Institution",
        president: "President's message",
        timeline: "Automotive timeline",
        tickets: "Buy tickets",
        hoursLink: "Hours & access",
        school: "School visits",
        members: "Members area",
        eventSpaces: "Event spaces",
        eventServices: "Event services",
        quote: "Request a proposal",
        garage: "Le Garage restaurant",
        media: "Press & media",
        news: "News",
        sitemap: "Sitemap",
        partners: "Partners",
        academy: "Automotive Academy",
        cookies: "Cookies",
        privacy: "Privacy policy",
        legalNotice: "Legal notice",
        terms: "Ticket terms",
        rights: "All rights reserved."
      }
    : {
        title: "Musée de l’Automobile du Maroc",
        intro: "Un footer plus sobre pour orienter clairement les visiteurs entre le Musée, la collection, l’événementiel et Le Garage.",
        address: "Route de Bouskoura, Casablanca",
        hours: "Mar-Dim · 10h00-18h00",
        contact: "contact@musee-automobile.ma",
        phone: "+212 600 270 387",
        discover: "Découvrir",
        visit: "Visiter",
        events: "Événementiel & restaurant",
        resources: "Ressources",
        legal: "Informations légales",
        collection: "La collection",
        history: "L’institution",
        president: "Le mot du Président",
        timeline: "Timeline automobile",
        tickets: "Acheter des billets",
        hoursLink: "Horaires & accès",
        school: "Visites scolaires",
        members: "Espace membres",
        eventSpaces: "Espaces événementiels",
        eventServices: "Services événementiels",
        quote: "Demander un devis",
        garage: "Le Garage restaurant",
        media: "Presse & médias",
        news: "Actualités",
        sitemap: "Plan du site",
        partners: "Partenaires",
        academy: "Automotive Academy",
        cookies: "Cookies",
        privacy: "Politique de confidentialité",
        legalNotice: "Mentions légales",
        terms: "CGV billetterie",
        rights: "Tous droits réservés."
      };

  footer.classList.add("footer--refreshed");
  footer.innerHTML = `
    <div class="footer-frame">
      <div class="footer-topline">
        <div class="footer-brandline">
          <strong>${copy.title}</strong>
          <p>${copy.intro}</p>
        </div>
        <div class="footer-contactline">
          <span>${copy.address}</span>
          <span>${copy.hours}</span>
          <a href="mailto:${copy.contact}">${copy.contact}</a>
          <a href="tel:+212600270387">${copy.phone}</a>
        </div>
      </div>

      <div class="footer-links-grid">
        <section>
          <h3>${copy.discover}</h3>
          <a href="${home}">${isEnglish ? "Home" : "Accueil"}</a>
          <a href="${collection}">${copy.collection}</a>
          <a href="${isEnglish ? "club.html" : "club.html"}">${copy.history}</a>
          <a href="${isEnglish ? "mot-president.html" : "mot-president.html"}">${copy.president}</a>
          <a href="${isEnglish ? "timeline.html" : "timeline.html"}">${copy.timeline}</a>
        </section>

        <section>
          <h3>${copy.visit}</h3>
          <a href="${tickets}">${copy.tickets}</a>
          <a href="${hours}">${copy.hoursLink}</a>
          <a href="${isEnglish ? "visites-scolaires.html" : "visites-scolaires.html"}">${copy.school}</a>
          <a href="${isEnglish ? "espace-membres.html" : "espace-membres.html"}">${copy.members}</a>
        </section>

        <section>
          <h3>${copy.events}</h3>
          <a href="${isEnglish ? "espaces-evenementiels.html" : "espaces-evenementiels.html"}">${copy.eventSpaces}</a>
          <a href="${isEnglish ? "services-evenementiels.html" : "services-evenementiels.html"}">${copy.eventServices}</a>
          <a href="${quote}">${copy.quote}</a>
          <a href="${garage}">${copy.garage}</a>
        </section>

        <section>
          <h3>${copy.resources}</h3>
          <a href="${isEnglish ? "actualites.html" : "actualites.html"}">${copy.news}</a>
          <a href="${isEnglish ? "presse-media.html" : "presse-media.html"}">${copy.media}</a>
          <a href="${isEnglish ? "plan-site.html" : "plan-site.html"}">${copy.sitemap}</a>
          <a href="${isEnglish ? "partenaires.html" : "partenaires.html"}">${copy.partners}</a>
          <a href="${isEnglish ? "automotive-academy.html" : "automotive-academy.html"}">${copy.academy}</a>
        </section>

        <section>
          <h3>${copy.legal}</h3>
          <a href="${isEnglish ? "mentions-legales.html" : "mentions-legales.html"}">${copy.legalNotice}</a>
          <a href="${isEnglish ? "politique-confidentialite.html" : "politique-confidentialite.html"}">${copy.privacy}</a>
          <a href="${isEnglish ? "politique-cookies.html" : "politique-cookies.html"}">${copy.cookies}</a>
          <a href="${isEnglish ? "cgv-billetterie.html" : "cgv-billetterie.html"}">${copy.terms}</a>
        </section>
      </div>

      <div class="footer-lower">
        <span>© 2026 ${copy.title}. ${copy.rights}</span>
        <span class="languages" aria-label="${isEnglish ? "Language switcher" : "Sélecteur de langue"}"></span>
        <span class="footer-legal-links">
          <a href="${home}">${isEnglish ? "Home" : "Accueil"}</a>
          <a href="${collection}">${copy.collection}</a>
          <a href="${tickets}">${copy.tickets}</a>
          <a href="${garage}">${copy.garage}</a>
          <a href="${quote}">${copy.quote}</a>
        </span>
      </div>
    </div>
  `;
})();
