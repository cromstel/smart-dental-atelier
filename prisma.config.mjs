import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

/**
 * Prisma CLI configuration (Prisma 7).
 *
 * The CLI no longer reads `.env` by itself and no longer takes the datasource
 * URL from `schema.prisma`; both now live here. `dotenv/config` is imported
 * first so `env("DATABASE_URL")` can read the project's `.env`.
 */
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    // v7 no longer runs the seed automatically after migrate/reset.
    seed: 'node prisma/seed.mjs',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
});