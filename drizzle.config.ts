import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: "postgresql://postgres.jjysfdhfnfuvyudybumf:dGQWK5rK4k5UVP5X@aws-0-sa-east-1.pooler.supabase.com:6543/postgres",
  },
});
