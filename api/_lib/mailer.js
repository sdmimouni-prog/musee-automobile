const nodemailer = require("nodemailer");
const { defaultTo } = require("./forms");

let cachedTransporter;

const getTransporter = () => {
  if (cachedTransporter) return cachedTransporter;

  const host = process.env.SMTP_HOST;
  const port = Number.parseInt(process.env.SMTP_PORT || "587", 10);
  const secure = String(process.env.SMTP_SECURE || "false").toLowerCase() === "true";
  const user = process.env.SMTP_USERNAME;
  const pass = process.env.SMTP_PASSWORD;

  if (!host || !user || !pass) {
    const error = new Error("SMTP configuration is incomplete. Please set SMTP_HOST, SMTP_USERNAME, and SMTP_PASSWORD.");
    error.statusCode = 500;
    throw error;
  }

  cachedTransporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass }
  });

  return cachedTransporter;
};

const sendEmail = async ({ subject, text, html, replyTo }) => {
  const transporter = getTransporter();
  const from = process.env.INTERNAL_NOTIFICATION_FROM || process.env.EMAIL_FROM || defaultTo;
  const to = process.env.CONTACT_FORM_TO || process.env.INTERNAL_NOTIFICATION_TO || defaultTo;

  await transporter.sendMail({
    from,
    to,
    replyTo: replyTo || process.env.INTERNAL_NOTIFICATION_REPLY_TO || defaultTo,
    subject,
    text,
    html
  });
};

module.exports = {
  sendEmail
};
