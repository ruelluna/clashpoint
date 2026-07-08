# Prevent Supabase Auth Edge Request Loops

**Date:** 2026-07-04

## Summary

Fixed redirect-loop and cookie-refresh bugs that could hammer Supabase Auth from Next.js Edge middleware. Aligned session checks (middleware) with role checks (layout/actions), added `/access-denied` for permission failures, narrowed middleware scope, and documented SSR auth guardrails. Rate limiting deferred until monitoring shows need.

## Changelog

- Authenticated users without admin profile no longer bounce between `/login` and `/dashboard` (no ERR_TOO_MANY_REDIRECTS).
- Sign-in rejects non-admin or profile-less accounts with a clear error instead of redirecting to dashboard.
- New `/access-denied` page explains lack of access and offers sign out.
- Middleware only runs on `/dashboard` and `/login`; home page no longer calls Supabase on every load.
- Session cookies from token refresh are preserved on middleware redirects.

## Files touched

### app/
- access-denied/page.tsx (new)
- page.tsx — removed live getSession() health check

### features/
- auth/actions.ts — admin check + sign out on access denied at login

### lib/
- auth/require-role.ts — non-admin to /access-denied
- supabase/middleware.ts (new)

### Root
- middleware.ts

### e2e/
- auth-login.spec.ts
- helpers/test-users.ts (new)

### .cursor/
- rules/supabase-auth-ssr.mdc (new)

## Deploy steps

No Supabase migration or new env vars. Deploy app as usual.

## Manual test steps

1. Open /dashboard while signed out — lands on /login once.
2. Sign in as admin — reaches /dashboard.
3. Profile-less user: sign in shows access denied; /dashboard goes to /access-denied without loop.
4. Home page / shows env status without live Supabase API call.

## Tests

Vitest: npm run test:run
E2E: npx playwright test e2e/auth-login.spec.ts (SUPABASE_SERVICE_ROLE_KEY for profile-less case)

## Rate limiting (deferred)

Add middleware throttle if Supabase Auth API spikes, edge invocations exceed page views, or users report redirect errors.

## Suggested ClashPoint commit

Summary: Fix Supabase auth redirect loops and edge request amplification

Body: Align middleware session gates with admin role checks, preserve refreshed cookies on redirects, and route permission failures to /access-denied instead of ping-ponging /login and /dashboard.

## Linear paste block

Title: Fix Supabase auth redirect loops and edge request amplification

Description:
- Removed middleware /login to /dashboard auto-redirect for any session
- Non-admin/profile-less users go to /access-denied or see login error
- Cookie-safe middleware redirects; matcher limited to /dashboard and /login
- E2E regression for profile-less user

Comment / instructions:
No migration. Deploy app. Test admin login and optional profile-less user flow. E2E: npx playwright test e2e/auth-login.spec.ts

Documentation: N/A
