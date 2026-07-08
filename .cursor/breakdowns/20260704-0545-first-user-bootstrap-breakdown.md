# First-user bootstrap on login

**Date:** 2026-07-04

## Summary

When Supabase has zero auth users, `/login` shows a first-admin bootstrap form instead of sign-in. Submitting the form creates the admin via the service-role client, relies on the existing profile trigger, auto-signs in, and redirects to the dashboard. After any user exists, the normal sign-in form is shown.

## Changelog

- Fresh installs with no auth users see **Create your first admin account** on `/login` with email, optional display name, password, and confirm password fields.
- Successful bootstrap auto-signs in and lands on `/dashboard`.
- Existing installs with users continue to see the standard **Sign in** form unchanged.
- Sign-in is blocked server-side when no users exist (defensive guard in `signInAction`).

## Files touched

### app/
- app/login/page.tsx — passes needsBootstrap from hasAnyAuthUsers()

### features/auth/
- features/auth/queries.ts — new hasAnyAuthUsers()
- features/auth/service.ts — new createFirstAdminUser()
- features/auth/service.test.ts — new Vitest coverage
- features/auth/schema.ts — createFirstUserSchema
- features/auth/schema.test.ts — bootstrap schema tests
- features/auth/utils.ts — POST_BOOTSTRAP_REDIRECT constant
- features/auth/actions.ts — createFirstUserAction, sign-in guard
- features/auth/components/first-user-form.tsx — new
- features/auth/components/login-page-client.tsx — conditional bootstrap vs login UI

### e2e/
- e2e/auth-login.spec.ts — sign-in vs bootstrap assertions, optional bootstrap happy path
- e2e/helpers/test-users.ts — countAuthUsers() helper

## Deploy steps

- No Supabase migration required.
- Ensure SUPABASE_SERVICE_ROLE_KEY is set in Vercel/server env so bootstrap detection works. If missing, the app fail-closes to sign-in mode (bootstrap form hidden).

## Manual test steps

1. Empty database: visit /login — confirm Create your first admin account heading.
2. Fill form, submit — confirm redirect to /dashboard.
3. Sign out — revisit /login — confirm Sign in form.
4. Existing users: /login shows Sign in only.

## E2E

npx playwright test e2e/auth-login.spec.ts
npm run test:run -- features/auth/schema.test.ts features/auth/service.test.ts

## Suggested ClashPoint commit

Summary: Add first-user bootstrap form on login

When no auth users exist, /login shows a create-first-admin form that uses the service role, auto-signs in, and redirects to the dashboard.

## Future setup wizard

Change POST_BOOTSTRAP_REDIRECT in features/auth/utils.ts from /dashboard to /setup when a multi-step setup route is added.
