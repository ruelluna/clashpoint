# Admin login and dashboard access control

**Date:** 2026-06-26

## Summary

Added admin-only RBAC with login-only auth: profiles table with default admin role, signup disabled, /login flow, and /dashboard route protection. Public home (/) remains accessible without signing in.

## Changelog

- New profiles table and app_role enum (admin only) with trigger on user creation
- Signup disabled in local Supabase config
- Login page at /login with email/password Server Action
- Dashboard at /dashboard with sign-out; middleware redirects unauthenticated users
- requireAdmin() helper for future Server Actions
- Playwright E2E spec for login guards and happy path

## Deploy steps

1. Apply migration on hosted Supabase (supabase db push or run SQL in dashboard).
2. In Supabase Dashboard -> Authentication -> Providers -> Email, disable Enable sign up.
3. Provision users via Authentication -> Users -> Add user (each gets admin profile via trigger).

## Manual test steps

1. Restart local Supabase after config change.
2. Apply migrations: supabase db reset (or push new migration).
3. Create a user in Supabase Studio -> Authentication -> Add user.
4. Visit http://localhost:3000/ - page loads without login.
5. Visit http://localhost:3000/dashboard - redirects to /login.
6. Sign in with provisioned credentials - lands on Dashboard.
7. Sign out - returns to login.

## E2E

Set PLAYWRIGHT_ADMIN_EMAIL and PLAYWRIGHT_ADMIN_PASSWORD in .env.local or CI, then:

npx playwright test e2e/auth-login.spec.ts

## Suggested ClashPoint commit

Add admin login and dashboard access control

Profiles default to admin, signup disabled, login-only flow, and /dashboard protection.
