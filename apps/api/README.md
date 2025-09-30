# API (apps/api)

Quick notes for developers working on the API package.

- Assessments: POST `/api/assessments` creates an assessment record, accepts metadata about uploaded PDFs (name/size/mime) but does NOT store the PDF binary in Supabase Storage.
  - Rationale: avoid filling Supabase storage with large blobs. The server validates per-file and total size limits (5MB per file, 50MB total) and persists only lightweight metadata as `attachment`-type question records.
  - The controller expects an Authorization header `Bearer <access_token>` (the token the frontend stores in `localStorage` as `sb_access_token`).

- RPC helper: POST `/api/rpc/query` is a small helper used by the frontend to fetch lists (categories, titles, profiles, etc.). It accepts a JSON body like:

```json
{
  "table": "assessments",
  "select": "distinct title",
  "order": { "by": "created_at", "direction": "desc" }
}
```

The RPC endpoint applies equality filters using `filter` (e.g. `{ filter: { user_id: "..." } }`). It is intentionally small and permissive for convenience in the monorepo; treat it as an internal helper.

If you need persistent file storage later, consider integrating S3 (or another object store) and adding an upload path that stores a reference (URL) in the database rather than raw binary data.
# Prova-Facil API (apps/api)

Local dev (requires dependencies installed):

```bash
# from repo root
cd apps/api
npm install
npm run dev:api   # starts Nest + Fastify dev server on port 3001 (or $PORT)
```

Build for deployment (Vercel):

```bash
cd apps/api
npm install
npm run build     # produces dist/main.js used by the serverless entry
```

Environment variables required in Vercel / server runtime:

- SUPABASE_URL                 # https://<project>.supabase.co
- SUPABASE_SERVICE_ROLE        # Service role (secret) for server-side admin operations
- FRONTEND_URL (optional)

Notes about keys:

- The server now requires a secure service key (recommended env name: `SUPABASE_SERVICE_ROLE`).
	Keep it secret; never expose it to the browser.

Applying SQL migrations (no Prisma)
----------------------------------

We maintain plain SQL migration drafts under `apps/api/supabase/migrations/` so you can apply them with `psql` or the Supabase CLI.

Example (using psql):

```bash
# enable pgcrypto (for gen_random_uuid)
psql "<SUPABASE_PSQL_CONNECTION_STRING>" -c "CREATE EXTENSION IF NOT EXISTS pgcrypto;"

# apply migration
psql "<SUPABASE_PSQL_CONNECTION_STRING>" -f apps/api/supabase/migrations/20250929_create_ai_tables.sql
```

Or using the Supabase CLI:

```bash
supabase db remote set mydb "<SUPABASE_PSQL_CONNECTION_STRING>"
supabase db query < apps/api/supabase/migrations/20250929_create_ai_tables.sql
```


Notes:

-   The serverless loader (`apps/api/api/index.js`) attempts to require `dist/main.js` (compiled Nest app). If missing, it falls back to the legacy Express handler.
-   Use `npm run dev:api` for local development to avoid needing the compiled `dist` output.
