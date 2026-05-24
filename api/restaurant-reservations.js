const {
  buildHtmlBody,
  buildTextBody,
  createReference,
  json,
  normalizeBody,
  requireFields,
  validateSecurity
} = require("./_lib/forms");
const { sendEmail } = require("./_lib/mailer");

module.exports = async (req, res) => {
  if (req.method === "OPTIONS") return json(res, 204, {});
  if (req.method !== "POST") return json(res, 405, { error: { message: "Method not allowed" } });

  try {
    const payload = normalizeBody(req);
    validateSecurity(payload);
    requireFields(payload, ["name", "phone", "guestCount", "reservationDate", "slot"]);

    const reference = payload.reference || createReference("GARAGE");
    const lines = [
      ["Type", "Reservation Le Garage"],
      ["Reference", reference],
      ["Nom", payload.name],
      ["Email", payload.email],
      ["Telephone", payload.phone],
      ["Nombre de personnes", payload.guestCount],
      ["Date", payload.reservationDate],
      ["Creneau", payload.slot],
      ["Message", payload.message]
    ];

    await sendEmail({
      subject: `[Le Garage] Demande de reservation ${reference}`,
      replyTo: payload.email,
      text: buildTextBody({ title: "Demande de reservation Le Garage", reference, payload, lines }),
      html: buildHtmlBody({ title: "Demande de reservation Le Garage", reference, lines })
    });

    return json(res, 200, {
      data: {
        reference,
        source: "Email"
      }
    });
  } catch (error) {
    return json(res, error.statusCode || 500, {
      error: {
        message: error.message || "Unable to submit form"
      }
    });
  }
};
