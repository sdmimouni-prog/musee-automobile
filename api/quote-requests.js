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
    requireFields(payload, ["name", "email"]);

    const reference = payload.reference || createReference("DEVIS");
    const lines = [
      ["Type", "Demande de devis evenementiel"],
      ["Reference", reference],
      ["Nom", payload.name],
      ["Email", payload.email],
      ["Telephone", payload.phone],
      ["Type d'evenement", payload.eventType],
      ["Nombre d'invites", payload.guestCount],
      ["Date souhaitee", payload.desiredDate],
      ["Message", payload.message]
    ];

    await sendEmail({
      subject: `[Musee Automobile] Demande de devis ${reference}`,
      replyTo: payload.email,
      text: buildTextBody({ title: "Demande de devis evenementiel", reference, payload, lines }),
      html: buildHtmlBody({ title: "Demande de devis evenementiel", reference, lines })
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
