export default ({ env }) => ({
  connection: {
    client: env("DATABASE_CLIENT", "postgres"),
    connection: {
      host: env("DATABASE_HOST", "127.0.0.1"),
      port: env.int("DATABASE_PORT", 5432),
      database: env("DATABASE_NAME", "cam_museum"),
      user: env("DATABASE_USERNAME", "cam_museum"),
      password: env("DATABASE_PASSWORD", "cam_museum"),
      schema: env("DATABASE_SCHEMA", "public"),
      ssl: env.bool("DATABASE_SSL", false)
        ? {
            rejectUnauthorized: env.bool("DATABASE_SSL_REJECT_UNAUTHORIZED", true),
          }
        : false,
    },
    pool: {
      min: env.int("DATABASE_POOL_MIN", 0),
      max: env.int("DATABASE_POOL_MAX", 10),
    },
  },
});
