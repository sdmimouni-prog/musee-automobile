(() => {
  const localHosts = new Set(["localhost", "127.0.0.1", ""]);
  const explicitUrl = window.CAM_RUNTIME_STRAPI_URL;
  const inferredUrl = localHosts.has(window.location.hostname)
    ? "http://localhost:1337"
    : window.location.origin;
  const strapiUrl = String(explicitUrl || inferredUrl).replace(/\/$/, "");

  const applyConfig = (key, defaults = {}) => {
    window[key] = {
      ...defaults,
      ...(window[key] || {}),
      strapiUrl,
      preferStrapi: true,
    };
  };

  applyConfig("CAM_COLLECTION_CONFIG", {
    localVehiclesUrl: "assets/dynamic-collection/data/vehicles.json",
    localCategoriesUrl: "assets/dynamic-collection/data/categories.json",
  });

  applyConfig("CAM_EDITORIAL_CONFIG", {
    localNewsUrl: "assets/dynamic-editorial/data/news.json",
    localEventsUrl: "assets/dynamic-editorial/data/events.json",
  });

  applyConfig("CAM_COMMERCE_CONFIG", {
    localCommerceUrl: "assets/dynamic-commerce/data/commerce.json",
  });

  applyConfig("CAM_FORM_CONFIG");
})();
