export default ({ env }) => ({
  i18n: {
    enabled: true,
  },
  "users-permissions": {
    enabled: true,
  },
  email: {
    config: {
      provider: env("EMAIL_PROVIDER", "nodemailer"),
      providerOptions: {
        host: env("SMTP_HOST", ""),
        port: env.int("SMTP_PORT", 587),
        secure: env.bool("SMTP_SECURE", false),
        auth: {
          user: env("SMTP_USERNAME", ""),
          pass: env("SMTP_PASSWORD", ""),
        },
      },
      settings: {
        defaultFrom: env("EMAIL_FROM", "no-reply@museeautomobile.ma"),
        defaultReplyTo: env("INTERNAL_NOTIFICATION_REPLY_TO", "contact@museeautomobile.ma"),
      },
    },
  },
});
