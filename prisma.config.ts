import 'dotenv/config';
import { defineConfig } from 'prisma/config';

/**
 * Prisma 7 reads connection settings from here instead of schema.prisma.
 * The CLI (db push, studio, migrate) uses `datasource.url`; the app itself
 * connects through the Neon serverless adapter in src/lib/prisma.ts.
 *
 * Read from process.env rather than prisma's strict env() so `prisma generate`
 * (postinstall) still works on a machine without DATABASE_URL.
 */
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
