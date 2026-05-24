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
    requireFields(payload, ["customerName", "email", "visitDate", "visitSlot"]);

    const reference = payload.reference || createReference("VIS");
    const amount = Number(payload.amount || 0);
    const ticketCount = Number(payload.ticketCount || 1);
    const lines = [
      ["Type", "Reservation visite"],
      ["Reference", reference],
      ["Nom", payload.customerName],
      ["Email", payload.email],
      ["Telephone", payload.phone],
      ["Date de visite", payload.visitDate],
      ["Creneau", payload.visitSlot],
      ["Billets", ticketCount],
      ["Montant", `${amount.toLocaleString("fr-FR")} Dhs`],
      ["Formule", payload.options?.formula],
      ["Type de visite", payload.options?.bookingType],
      ["Langue", payload.options?.language],
      ["Arrivee", payload.options?.arrival],
      ["Options", payload.options?.selectedOptions],
      ["Notes", payload.notes]
    ];

    await sendEmail({
      subject: `[Musee Automobile] Demande de reservation ${reference}`,
      replyTo: payload.email,
      text: buildTextBody({ title: "Demande de reservation visite", reference, payload, lines }),
      html: buildHtmlBody({ title: "Demande de reservation visite", reference, lines })
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
