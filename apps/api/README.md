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

Environment variables required in Vercel:

-   SUPABASE_URL
-   SUPABASE_SERVICE_ROLE (secret)
-   VITE_SUPABASE_URL
-   VITE_SUPABASE_ANON_KEY
-   FRONTEND_URL (optional)

Notes:

-   The serverless loader (`apps/api/api/index.js`) attempts to require `dist/main.js` (compiled Nest app). If missing, it falls back to the legacy Express handler.
-   Use `npm run dev:api` for local development to avoid needing the compiled `dist` output.
