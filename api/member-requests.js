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

    const reference = payload.reference || createReference("MEMBRE");
    const lines = [
      ["Type", "Demande d'adhesion"],
      ["Reference", reference],
      ["Nom", payload.name],
      ["Email", payload.email],
      ["Telephone", payload.phone],
      ["Formule", payload.membershipType],
      ["Message", payload.message]
    ];

    await sendEmail({
      subject: `[Musee Automobile] Demande d'adhesion ${reference}`,
      replyTo: payload.email,
      text: buildTextBody({ title: "Demande d'adhesion", reference, payload, lines }),
      html: buildHtmlBody({ title: "Demande d'adhesion", reference, lines })
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
