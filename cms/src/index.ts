const publicCollectionActions = [
  "api::vehicle.vehicle.find",
  "api::vehicle.vehicle.findOne",
  "api::vehicle-category.vehicle-category.find",
  "api::vehicle-category.vehicle-category.findOne",
  "api::news-article.news-article.find",
  "api::news-article.news-article.findOne",
  "api::event.event.find",
  "api::event.event.findOne",
  "api::ticket-type.ticket-type.find",
  "api::ticket-type.ticket-type.findOne",
  "api::booking-option.booking-option.find",
  "api::booking-option.booking-option.findOne",
  "api::visit-slot.visit-slot.find",
  "api::visit-slot.visit-slot.findOne",
  "api::restaurant-menu-item.restaurant-menu-item.find",
  "api::restaurant-menu-item.restaurant-menu-item.findOne",
  "api::booking.booking.create",
  "api::quote-request.quote-request.create",
  "api::restaurant-reservation.restaurant-reservation.create",
  "api::member-request.member-request.create",
  "plugin::upload.content-api.find",
  "plugin::upload.content-api.findOne",
];

const publicReadBootstrapEnabled = () => {
  const value = process.env.BOOTSTRAP_PUBLIC_READ;
  return value === undefined || value === "true" || value === "1";
};

const ensurePublicPermission = async (strapi: any, roleId: number, action: string) => {
  const permissions = strapi.db.query("plugin::users-permissions.permission");
  const existing = await permissions.findOne({
    where: {
      action,
      role: {
        id: roleId,
      },
    },
  });

  if (existing) {
    if (existing.enabled !== true) {
      await permissions.update({
        where: { id: existing.id },
        data: {
          enabled: true,
          conditions: [],
          properties: {},
        },
      });
    }
    return false;
  }

  await permissions.create({
    data: {
      action,
      role: roleId,
      enabled: true,
      conditions: [],
      properties: {},
    },
  });

  return true;
};

const syncPublicReadPermissions = async (strapi: any) => {
  if (!publicReadBootstrapEnabled()) return;

  const publicRole = await strapi.db.query("plugin::users-permissions.role").findOne({
    where: { type: "public" },
  });

  if (!publicRole) {
    strapi.log.warn("Public role not found; collection API permissions were not synchronized.");
    return;
  }

  let created = 0;
  for (const action of publicCollectionActions) {
    if (await ensurePublicPermission(strapi, publicRole.id, action)) created += 1;
  }

  if (created > 0) {
    strapi.log.info(`Public collection read permissions synchronized (${created} created).`);
  }
};

export default {
  register() {},
  async bootstrap({ strapi }) {
    await syncPublicReadPermissions(strapi);
  },
};
