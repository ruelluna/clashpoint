# Public registration admin client reads — breakdown

**Date:** 2026-07-16

## Summary

Anonymous public registration failed because server actions **created** rows with the admin client but **read** `competitors` and `reference_values` with the session/anon client. RLS only allows authenticated staff on those tables. Fixed by routing public registration reads through `createAdminClient()` while still returning only safe fields to the browser.

## Changelog

- Existing game farm search dropdown works for logged-out visitors
- New game farm registration no longer fails with "Selected game farm was not found" after competitor insert
- OTP send/verify can load competitor email server-side for anonymous users
- Public rooster submit can catalog color/marking via admin client when `reference_values` table exists
- Search errors surface in the game farm picker UI

## Files touched

- `features/competitors/queries.ts` — `CompetitorQueryOptions`, admin client for `searchPublicGameFarms` and optional `getCompetitor`
- `features/competitors/queries.test.ts` — Vitest for admin vs session client
- `features/entries/service.ts` — `createEntry` passes `useAdminClient` to `getCompetitor`
- `features/public/owner-registration-service.ts` — OTP flows use admin `getCompetitor`
- `features/reference-values/service.ts` — `ReferenceValueQueryOptions` for catalog
- `features/weighing/service.ts` — `catalogReferenceValues(..., options)`
- `features/public/actions.ts` — try/catch on search action
- `features/public/components/public-game-farm-picker.tsx` — try/catch fallback
- `e2e/public-registration.spec.ts` — anonymous visitor spec

## Deploy steps

- No new migration required for this fix
- Ensure `SUPABASE_SERVICE_ROLE_KEY` is set in production (required for admin client)
- Confirm `reference_values` table exists on hosted Supabase (run `202607121709_reference_values.sql` in SQL Editor if missing)

## Manual test steps

1. Open **incognito** (not logged in as admin)
2. Go to `/events/{public-open-event-id}/register`
3. **New game farm** → Continue → add rooster → Submit → success
4. **Existing game farm** tab → type 2+ chars of a known farm name → farm appears in list
5. Select farm with email → Send verification code → enter OTP (use `REGISTRATION_OTP_TEST_MODE=true` locally)
6. Submit rooster with color/marking filled (requires `reference_values` table)

## Tests

```bash
npm run test:run -- features/competitors/queries.test.ts
npx playwright test e2e/public-registration.spec.ts
```

E2E anonymous spec: `Public staged registration anonymous` → `visitor without login completes new game farm registration`

## Suggested commit

**Summary:** Fix anonymous public registration with admin client reads

**Body:** Public registration now reads competitors and reference values via the service role on the server, fixing empty search and "game farm not found" errors for logged-out visitors while keeping RLS strict for anon.

## Documentation

N/A — internal server-side fix; no admin/user doc changes.
