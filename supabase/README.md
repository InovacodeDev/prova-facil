Local Supabase/Postgres for prova-facil

This folder contains helper instructions to run a local Postgres instance compatible with the project's `.env` settings.

Quick start (macOS / zsh):

1.  Start the database with Docker Compose:

```bash
   # from the repo root
   docker compose up -d
```

2. Confirm Postgres is ready:

```bash
   docker compose logs -f db
   # or
   pg_isready -h 127.0.0.1 -p 54322 -U postgres
```

3. Run the consolidated migration (uses DATABASE_URL from .env):
```bash
   # load env (zsh)
   set -o allexport; source .env; set +o allexport
   # apply migration
   psql "$SUPABASE_URL" -f supabase/migrations/20250929_235959_consolidated_ordered.sql
```

Notes:
- The compose file exposes Postgres on port 54322 which matches `.env`.
- pgAdmin is available on http://localhost:8080 (admin@local / admin).
- The `./supabase/init` directory can hold SQL files that will be run on first DB initialization.

# Supabase migrations (SQL)

This folder contains plain SQL migration drafts for the API. They are intended to be applied directly to your Supabase Postgres database using `psql` or the Supabase CLI.
Files:
-   `20250929_create_ai_tables.sql` — creates `categories`, `questions`, and `answers` tables used by the AI generator.

## How to apply

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
