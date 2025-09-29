Monorepo & Vercel deployment notes

Required environment variables (set in Vercel Project settings):

-   SUPABASE_URL - your Supabase project URL (e.g. https://xxx.supabase.co)
-   SUPABASE_SERVICE_ROLE - Supabase service_role key (keep secret)
-   FRONTEND_URL - optional, frontend origin for CORS

How it works:

-   apps/web is the frontend (Vite). It will call relative /api/\* paths in production.
-   apps/api exposes a serverless entry at `apps/api/api/index.js` that Vercel maps to `/api/*` via `vercel.json` routes.
-   The API uses the Supabase service role key to perform sensitive actions (create user, change password, insert rows).

Deploy on Vercel:

1. Set Root Directory to `.` (root of repository) or `apps/web` depending on your desired deployment strategy.
2. Ensure `vercel.json` is present in repo root (this project includes one) so Vercel rewrites `/api/*` to `apps/api/api/index.js`.
3. Add required environment variables in the Vercel dashboard.

Notes:

-   This initial scaffold implements a minimal API surface. You may need to expand it and add validation, authentication middleware, and rate-limiting.
    Local testing and curl examples:

1. Install dependencies for the api package:

    cd apps/api
    npm install

2. Start a simple Node process that will serve the express app (or use Vercel CLI to emulate serverless functions):

    node apps/api/api/index.js

3. Test endpoints using the provided curl harness. Export a valid Supabase session access token in TOKEN before running:

    export BASE_URL=http://localhost:3000
    export TOKEN=<your_session_access_token>
    ./apps/api/test-curl.sh

Note: The harness performs a health check, a GET /api/auth/me and a POST /api/rpc/query request when TOKEN is present.

Security reminder: Keep SUPABASE_SERVICE_ROLE secret in your Vercel project settings. Do not commit it to source control.
