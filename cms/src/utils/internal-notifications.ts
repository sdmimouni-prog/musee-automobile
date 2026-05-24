const labels = {
  booking: "Nouvelle réservation visite",
  "quote-request": "Nouvelle demande de devis",
  "restaurant-reservation": "Nouvelle réservation restaurant",
  "member-request": "Nouvelle demande membre",
};

const adminPaths = {
  booking: "api::booking.booking",
  "quote-request": "api::quote-request.quote-request",
  "restaurant-reservation": "api::restaurant-reservation.restaurant-reservation",
  "member-request": "api::member-request.member-request",
};

const collectionPaths = {
  booking: "api::booking.booking",
  "quote-request": "api::quote-request.quote-request",
  "restaurant-reservation": "api::restaurant-reservation.restaurant-reservation",
  "member-request": "api::member-request.member-request",
};

const recipients = () => String(process.env.INTERNAL_NOTIFICATION_TO || "")
  .split(",")
  .map((item) => item.trim())
  .filter(Boolean);

const enabled = () => {
  const value = process.env.INTERNAL_NOTIFICATIONS_ENABLED;
  return value === undefined || value === "true" || value === "1";
};

const escapeHtml = (value) => String(value ?? "")
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#039;");

const formatValue = (value) => {
  if (value === null || value === undefined || value === "") return "—";
  if (Array.isArray(value)) return value.map(formatValue).join(", ");
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
};

const rows = (items) => items
  .filter(([, value]) => value !== undefined && value !== null && value !== "")
  .map(([label, value]) => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;color:#666;font-weight:700">${escapeHtml(label)}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;color:#111">${escapeHtml(formatValue(value))}</td>
    </tr>
  `)
  .join("");

const adminUrl = (type, result) => {
  const baseUrl = String(process.env.STRAPI_ADMIN_URL || process.env.PUBLIC_URL || "http://localhost:1337").replace(/\/$/, "");
  const uid = collectionPaths[type];
  const id = result?.documentId || result?.id;
  return `${baseUrl}/admin/content-manager/collection-types/${uid}/${id}`;
};

const detailsFor = (type, result) => {
  if (type === "booking") {
    return [
      ["Référence", result.reference],
      ["Nom", result.customerName],
      ["Email", result.email],
      ["Téléphone", result.phone],
      ["Date", result.visitDate],
      ["Créneau", result.visitSlot],
      ["Billets", result.ticketCount],
      ["Montant", result.amount],
      ["Statut", result.status],
      ["Paiement", result.paymentStatus],
      ["Notes", result.notes],
    ];
  }

  if (type === "quote-request") {
    return [
      ["Nom", result.name],
      ["Email", result.email],
      ["Téléphone", result.phone],
      ["Type", result.eventType],
      ["Invités", result.guestCount],
      ["Date souhaitée", result.desiredDate],
      ["Message", result.message],
      ["Statut", result.status],
    ];
  }

  if (type === "restaurant-reservation") {
    return [
      ["Nom", result.name],
      ["Email", result.email],
      ["Téléphone", result.phone],
      ["Personnes", result.guestCount],
      ["Date", result.reservationDate],
      ["Créneau", result.slot],
      ["Message", result.message],
      ["Statut", result.status],
    ];
  }

  return [
    ["Nom", result.name],
    ["Email", result.email],
    ["Téléphone", result.phone],
    ["Formule", result.membershipType],
    ["Message", result.message],
    ["Statut", result.status],
  ];
};

const subjectFor = (type, result) => {
  const label = labels[type] || "Nouvelle demande";
  const name = result.customerName || result.name || result.email || result.reference || "site web";
  return `[CAM] ${label} - ${name}`;
};

const htmlFor = (type, result) => {
  const label = labels[type] || "Nouvelle demande";
  const link = adminUrl(type, result);

  return `
    <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111">
      <h1 style="font-size:22px;margin:0 0 12px">${escapeHtml(label)}</h1>
      <p style="margin:0 0 18px;color:#555">Une nouvelle demande a été créée depuis le site web du Musée de l'Automobile du Maroc.</p>
      <table style="width:100%;border-collapse:collapse;border:1px solid #eee">${rows(detailsFor(type, result))}</table>
      <p style="margin:18px 0 0">
        <a href="${escapeHtml(link)}" style="display:inline-block;background:#111;color:#fff;text-decoration:none;padding:10px 14px;border-radius:4px">Ouvrir dans Strapi</a>
      </p>
    </div>
  `;
};

const textFor = (type, result) => {
  const details = detailsFor(type, result)
    .map(([label, value]) => `${label}: ${formatValue(value)}`)
    .join("\n");
  return `${labels[type] || "Nouvelle demande"}\n\n${details}\n\nStrapi: ${adminUrl(type, result)}`;
};

const markNotification = async (strapi, uid, result, data) => {
  const id = result?.id;
  if (!id) return;

  await strapi.db.query(uid).update({
    where: { id },
    data,
  });
};

const emailService = (strapi) => {
  try {
    return strapi.plugin("email")?.service("email");
  } catch (error) {
    strapi.log.debug(`Email plugin lookup failed: ${error.message}`);
    return null;
  }
};

export const notifyPublicSubmission = async (strapi, type, result) => {
  const uid = adminPaths[type];
  if (!uid || !result?.id) return;

  if (!enabled()) {
    await markNotification(strapi, uid, result, {
      notificationStatus: "skipped",
      notificationError: "Internal notifications disabled",
    });
    return;
  }

  const to = recipients();
  if (!to.length) {
    await markNotification(strapi, uid, result, {
      notificationStatus: "skipped",
      notificationError: "INTERNAL_NOTIFICATION_TO is not configured",
    });
    return;
  }

  const service = emailService(strapi);
  if (!service?.send) {
    await markNotification(strapi, uid, result, {
      notificationStatus: "skipped",
      notificationError: "Strapi email plugin is unavailable",
    });
    return;
  }

  try {
    await service.send({
      to,
      from: process.env.INTERNAL_NOTIFICATION_FROM || process.env.EMAIL_FROM || undefined,
      replyTo: result.email || process.env.INTERNAL_NOTIFICATION_REPLY_TO || undefined,
      subject: subjectFor(type, result),
      text: textFor(type, result),
      html: htmlFor(type, result),
    });

    await markNotification(strapi, uid, result, {
      notificationStatus: "sent",
      notificationSentAt: new Date().toISOString(),
      notificationError: null,
    });
  } catch (error) {
    strapi.log.error(`Internal notification failed for ${type} ${result.id}: ${error.message}`);
    await markNotification(strapi, uid, result, {
      notificationStatus: "failed",
      notificationError: String(error.message || error).slice(0, 2000),
    });
  }
};
