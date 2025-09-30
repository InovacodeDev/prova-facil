Supabase migrations (SQL)
=========================

This folder contains plain SQL migration drafts for the API. They are intended to be applied directly to your Supabase Postgres database using `psql` or the Supabase CLI.

Files:

- `20250929_create_ai_tables.sql` — creates `categories`, `questions`, and `answers` tables used by the AI generator.

How to apply
------------

1. Get the psql connection string from Supabase Dashboard → Settings → Database → Connection string (psql).

2. Enable pgcrypto (if not already enabled):

   ```bash
   psql "<PSQL_CONN>" -c "CREATE EXTENSION IF NOT EXISTS pgcrypto;"
   ```

3. Run the migration:

   ```bash
   psql "<PSQL_CONN>" -f apps/api/supabase/migrations/20250929_create_ai_tables.sql
   ```

Or use the Supabase CLI:

   ```bash
   supabase db remote set mydb "<PSQL_CONN>"
   supabase db query < apps/api/supabase/migrations/20250929_create_ai_tables.sql
   ```

If you'd like, I can also generate a one-off script that checks whether the tables exist and creates them programmatically from Node (useful for CI). Ask and I will add it.
