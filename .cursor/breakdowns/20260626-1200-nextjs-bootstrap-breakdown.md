# Next.js Bootstrap Breakdown

**Date:** 2026-06-26

## Summary

Bootstrapped Next.js 16 App Router into the existing ClashPoint repo without overwriting `supabase/`, `.cursor/`, or `AGENTS.md`. Added Supabase SSR clients, auth helpers, middleware, shadcn/ui, Playwright config stub, and a minimal ClashPoint landing page.

## Changelog

- Next.js 16 + TypeScript + Tailwind v4 + ESLint scaffolded via temp folder merge
- Supabase browser/server/admin clients in `lib/supabase/`
- Auth helpers (`getUser`, `requireUser`) in `lib/auth/`
- Session refresh middleware at repo root
- shadcn/ui initialized with Button primitive and `lib/utils.ts`
- `.env.example` and local `.env.local` with Supabase local keys
- ClashPoint home page with Supabase env/API status
- Playwright config stub (`e2e/` empty — specs N/A until first user flow)
- Updated `.cursorignore` and `.gitignore` for Next.js patterns

## Files touched

### app/
- `app/layout.tsx` — ClashPoint metadata
- `app/page.tsx` — landing + Supabase status
- `app/globals.css` — shadcn theme

### lib/
- `lib/supabase/client.ts`, `server.ts`, `admin.ts`
- `lib/auth/index.ts`
- `lib/docs.ts`
- `lib/utils.ts` (shadcn)

### Root
- `package.json`, `package-lock.json`, `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`, `eslint.config.mjs`
- `middleware.ts`, `playwright.config.ts`, `components.json`
- `.env.example`, `.gitignore`, `.cursorignore`
- `components/ui/button.tsx`
- `features/.gitkeep`, `e2e/.gitkeep`

## Deploy steps

- Copy `.env.example` to `.env.local` and fill Supabase keys
- Ensure local Supabase: `supabase start`
- Production: set env vars in Vercel/hosting; link remote Supabase project when ready

## Manual test steps

1. `supabase status` — confirm local stack running
2. `npm run dev` — open http://localhost:3000
3. Verify page shows **ClashPoint**, **Supabase env: Configured**, **Supabase API: Connected**
4. `npm run build` — production build succeeds

## E2E

N/A — no user-facing flows yet. Config only: `playwright.config.ts`.

When first flow ships: `npx playwright test`

## Suggested commit

```
Bootstrap Next.js App Router with Supabase SSR and shadcn/ui

Scaffold via temp create-next-app merge to preserve existing supabase/
migrations and Cursor rules. Adds lib/supabase clients, auth middleware,
.env.example, and ClashPoint folder layout.
```

## Linear paste block

```
Title: Bootstrap Next.js App Router with Supabase SSR and shadcn/ui

Description:
ClashPoint now runs on Next.js 16 App Router with Supabase SSR clients,
auth middleware, shadcn/ui, and the feature-module folder layout from AGENTS.md.
Existing supabase/ migrations and Cursor rules were preserved.

Comment / instructions:
Copy .env.example to .env.local. Run supabase start, then npm run dev.
Home page at / confirms Supabase env and API connectivity.

Documentation:
N/A — no published doc changes in this pass.
```
