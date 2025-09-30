# Prova Fácil — Monorepo

A concise, developer-focused README following the Codex template. It documents the monorepo layout, how Supabase is centralized in the API, environment variables, local development steps, AI question-generation feature, database migrations (raw SQL), and recommended next steps. This file is intentionally comprehensive and actionable for a new developer onboarding the project.

## Table of contents

-   Project overview
-   Monorepo structure
-   Key technologies
-   Environment variables
-   Local development
    -   Prerequisites
    -   Running the API
    -   Running the Web app
    -   Running linters and typecheck
-   Supabase setup and migration
-   AI question generation (server-side)
-   Removing frontend Supabase usage (architecture notes)
-   Testing
-   Troubleshooting & common pitfalls
-   Next steps and suggestions

---

## Project overview

`prova-facil` is a small monorepo containing two primary apps:

-   `apps/api` — a NestJS/Fastify backend that centralizes all Supabase access (service-role/admin + anon), exposes API endpoints, implements server-side AI question generation, and stores results in Postgres via raw SQL migrations.
-   `apps/web` — a Vite + React frontend that calls the backend API for all data operations. The frontend no longer holds a Supabase client — Supabase access is centralized in the API.

Design goals:

-   Keep secrets and DB access server-side (security-first).
-   Avoid Prisma; use raw SQL migrations that run against Supabase/Postgres.
-   Provide server-side AI generation for assessment questions (OpenAI integration with local fallback).
-   Keep frontend client lightweight and dependent on backend endpoints.

---

## Monorepo structure (high level)

Relevant top-level files and folders:

-   `apps/api/` — NestJS backend
    -   `src/` — application sources
        -   `services/supabase.service.ts` — central service that wraps Supabase operations and AI logic
        -   `main.ts`, `app.module.ts` — Nest app bootstrap
    -   `supabase/` — migrations and database setup
        -   `migrations/` — raw SQL migration files
    -   `package.json` — package scripts for API
-   `apps/web/` — React + Vite frontend
    -   `src/` — React sources (pages, components)
    -   `package.json` — package scripts for web
-   `package.json` (root) — workspace scripts (turbo), shared dev scripts
-   `tsconfig.json`, `pnpm-workspace.yaml`, `vercel.json`, `turbo.json`

Look at `apps/api/README.md` for API-specific instructions.

---

## Key technologies

-   Node.js + pnpm monorepo
-   NestJS + Fastify (backend)
-   Vite + React (frontend)
-   Supabase (Postgres) — DB & authentication
-   OpenAI (or compatible) for AI-driven question generation
-   ESLint + TypeScript (strict settings) for code quality
-   Raw SQL migrations (no Prisma)

---

## Environment variables

Use the root `.env` (or read from the parent `.env`) when running apps locally. Example variables found in `.env.example`:

-   SUPABASE_URL — Supabase project URL
-   SUPABASE_ANON_KEY — Supabase anon (client) key (only for safe on-client usage) — not required in web if the frontend uses only API endpoints
-   SUPABASE_SERVICE_ROLE_KEY — server-side service role key (must remain secret; used by `apps/api`)
-   OPENAI_KEY — (optional) API key for OpenAI
-   COOKIE_SECRET — secret used to sign auth cookies
-   API_URL / FRONTEND_URL / PORT variants — local host/port config

Important security note: never commit secrets. The API must be the only place with the service role key.

---

## Local development

Prerequisites

-   Node.js (recommended 18+)
-   pnpm (the repo uses pnpm workspaces)
-   (Optional) Docker for a local Postgres/Supabase replica or use a Supabase project

Install dependencies (run at repo root):

```bash
pnpm install
```

Run the API (development)

```bash
# from repo root
pnpm --filter @prova-facil/api dev
```

Run the web app (development)

```bash
# from repo root
pnpm --filter @prova-facil/web dev
```

Run tests / typecheck / lint

```bash
# Typecheck API
pnpm --filter @prova-facil/api -s exec tsc --noEmit

# ESLint (per-package)
pnpm --filter @prova-facil/web -s exec eslint . --ext .ts,.tsx
# To run workspace-level lint (turbo), ensure eslint binaries are discoverable in each package or install devDeps:
pnpm -w run lint
```

---

## Supabase setup & migrations

This project uses raw SQL migrations stored in `apps/api/supabase/migrations/`. Migrations are applied to your Postgres/Supabase database.

To apply migrations locally you can use the Supabase CLI or psql against your database. Example using `psql`:

```bash
psql "$DATABASE_URL" -f apps/api/supabase/migrations/2025..._create_ai_tables.sql
```

Or with the Supabase CLI (recommended if you use Supabase hosted service):

```bash
supabase db push --project-ref <your-ref>
# or run migration files manually if you're not using the CLI's migrations system
```

Notes:

-   Migrations are raw SQL. Review them before applying to production.
-   The API code expects certain tables (created by the migrations) for AI-generated questions and assessments.

---

## AI question generation (server-side)

The API contains logic to generate assessment questions server-side. Key points:

-   `apps/api/src/services/supabase.service.ts` contains `generateQuestions(...)` which tries OpenAI (if `OPENAI_KEY` is configured) and falls back to a local generator otherwise.
-   Generated questions are persisted to the Postgres DB via SQL inserts (see `supabase/migrations/` for expected schema).
-   This design ensures question generation happens server-side (no OpenAI key exposure on clients).

---

## Removing frontend Supabase usage (architecture notes)

-   The frontend no longer creates a Supabase client. All DB/auth work is proxied through the API.
-   `apps/api/supabase/client.ts` provides `getAdminSupabaseClient()` (service-role) and `getAnonSupabaseClient()` factories.
-   `apps/api/src/services/supabase.service.ts` centralizes Supabase usage and avoids importing `@supabase/supabase-js` types directly by using `ReturnType<typeof getAdminSupabaseClient>` where needed.
-   If you want to remove `@supabase/supabase-js` from `apps/web` entirely, replace any remaining type imports (e.g. `User`) with local type aliases and then remove the dependency from `apps/web/package.json` and run `pnpm install`.

---

## Testing

-   Unit/integration tests should be added under each app's `test/` or `src/__tests__` directories using `vitest` or your test runner of choice.
-   E2E tests can use Playwright to test the running stack.

---

## Troubleshooting & common pitfalls

-   ESLint missing in CI or for workspace-level runs: ensure `eslint` is present as a devDependency in every package that runs lint, or make sure `pnpm install` installs the workspace binaries so `pnpm -w run lint` can find them.
-   `.env` location: Vite (web) must point to the parent `.env` if you want apps to share the root `.env`. Check `vite.config.ts` / `envDir`.
-   Supabase service role key must only live in the API environment (never in client apps or committed files).

---

## Next steps and suggestions

-   Run a full workspace lint + typecheck and fix any remaining issues:
    -   `pnpm -w install` then `pnpm -w run lint` and `pnpm -w run typecheck` (if configured)
-   Decide whether `apps/web` should fully drop `@supabase/supabase-js` from its `package.json` (recommended if frontend no longer needs it). If yes, remove the dep and run `pnpm -w install` to update lockfiles.
-   Add a CI workflow (`.github/workflows/ci.yml`) that runs `pnpm -w run lint`, `pnpm -w run test`, and `pnpm -w run build`.
-   Add tests for `generateQuestions()` covering OpenAI success, fallback, and DB persistence.

---

If you'd like, I can now:

-   Commit the README to the repo (I will not commit it until you ask), or
-   Replace the last `@supabase/supabase-js` type usage in `apps/web/src/pages/Dashboard.tsx`, and then remove the dependency from the web package and update the lockfile.

Tell me which step you want next.

---

## Cookie-based authentication and CSRF (migration notes)

This project uses cookie-based authentication for the web app to avoid storing access tokens in localStorage. To protect state-changing endpoints from CSRF, the API implements a simple double-submit CSRF pattern:

-   The server sets three cookies on sign-in/refresh:

    -   `sb_access_token` (httpOnly) — short-lived access token.
    -   `sb_refresh_token` (httpOnly) — long-lived refresh token.
    -   `sb_csrf` (NOT httpOnly) — a random token readable by client JS used for double-submit CSRF protection.

-   For state-changing requests (POST/PUT/PATCH/DELETE) the client must send the header `x-csrf-token` with the value of the `sb_csrf` cookie. The server verifies the header equals the cookie before allowing the request.

Developer notes:

-   The client helper `apps/web/src/lib/api.ts` automatically attaches the `x-csrf-token` header for unsafe HTTP methods by reading the `sb_csrf` cookie. It also sends credentials (cookies) on every request and performs a single automatic refresh if a 401 is received.

-   You can disable CSRF enforcement locally by setting the environment variable `DISABLE_CSRF=true` when running the API. Do NOT set this in production.

-   After merging the cookie-based auth changes, rebuild the web app so the `apps/web/dist` bundle is regenerated and no longer contains references to localStorage-held tokens:

```bash
# from the repo root
pnpm --filter @prova-facil/web build
```

Testing the refresh flow manually:

1. Start the API and web app locally.
2. Sign in via the web UI — browser cookies `sb_access_token`, `sb_refresh_token`, and `sb_csrf` should be set.
3. Make a state-changing request (create assessment, change profile). `x-csrf-token` will be sent automatically by `apiFetch`.
4. To test refresh behavior: expire or revoke the `sb_access_token` (server-side or by clearing the cookie) and perform an API call — the client will call `/api/auth/refresh` once using the refresh cookie and retry the original request if refresh succeeds.

Security considerations:

-   Double-submit CSRF is simple and effective for same-site applications; consider a more robust CSRF strategy if you need stricter protections (synchronizer token pattern, SameSite=strict, or origin checks).
-   Always ensure cookies are set with `secure=true` in production and consider tightening `sameSite` depending on your integration scenarios.
