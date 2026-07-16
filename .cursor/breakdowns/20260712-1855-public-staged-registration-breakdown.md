# Public staged registration — breakdown

**Date:** 2026-07-12

## Summary

Shipped two-step public online registration for **Classic and Derby** events: Step 1 registers or verifies a game farm (email OTP for existing farms via Resend); Step 2 adds rooster(s) against a short-lived signed session cookie. Registration appears when the event is **public**, **Open**, and before deadline when set.

## Changelog (organizer / player visible)

- Public event pages show **Register** tab and overview CTA when registration is open (Classic + Derby).
- `/events/[id]/register` is a **two-step wizard**: game farm → rooster registration.
- **New game farm:** name, contact, required email → rooster step.
- **Existing game farm:** search dropdown (no email/phone exposed) → email OTP → rooster step.
- Dashboard **Registration link** panel shown for all **public** events (not derby-only).
- Online entries use `entry_source: online`; staff review in Rooster Entries as before.

## Files touched

### `app/`
- `app/events/[id]/register/page.tsx` — wizard + session resume
- `app/events/[id]/page.tsx` — Register CTA
- `app/dashboard/events/[id]/page.tsx` — share link for public Classic/Derby

### `features/`
- `features/public/owner-verification.ts`, `owner-verification.test.ts`
- `features/public/session-cookie.ts`
- `features/public/owner-registration-service.ts`
- `features/public/rooster-registration-service.ts`
- `features/public/actions.ts`, `schema.ts`, `schema.test.ts`, `queries.ts`
- `features/public/components/public-registration-wizard.tsx`
- `features/public/components/public-game-farm-step.tsx`
- `features/public/components/public-game-farm-picker.tsx`
- `features/public/components/public-rooster-step.tsx`
- `features/competitors/queries.ts`, `service.ts` — public search + `createPublicCompetitor`
- `features/entries/service.ts` — null actor + admin client rooster adds
- `features/entries/components/rooster-entry-slots.tsx` — optional `slotCount`
- `features/events/components/registration-share-link.tsx` — two-step copy
- Removed: `features/public/service.ts`, `features/public/components/public-entry-form-client.tsx`

### `lib/`
- `lib/email/resend.ts`

### `supabase/`
- `supabase/migrations/202607151830_registration_owner_verifications.sql`

### `e2e/`
- `e2e/public-registration.spec.ts` — staged flow, Classic tab, duplicate guard

### `.env.example`
- `REGISTRATION_OTP_SECRET`, `REGISTRATION_EMAIL_FROM`, `RESEND_API_KEY`, `REGISTRATION_OTP_TEST_MODE`

## Deploy steps

1. Apply migration:
   ```bash
   supabase db push --include-all
   ```
2. Set env (Vercel / local):
   - `REGISTRATION_OTP_SECRET` — long random string (OTP + session HMAC pepper)
   - `RESEND_API_KEY` — Resend API key
   - `REGISTRATION_EMAIL_FROM` — verified sender (e.g. `ClashPoint <noreply@yourdomain.com>`)
   - Optional: `REGISTRATION_OTP_TEST_MODE=true` in dev/E2E (logs OTP, skips Resend)
   - Optional: `NEXT_PUBLIC_SITE_URL` for absolute links in emails
3. Deploy app after migration + env.

## Manual test steps

1. Edit event → check **Public event** → Save → **Mark Open**.
2. Copy registration link from dashboard overview (public Classic or Derby).
3. Open `/events/{id}/register` as anonymous user.
4. **New farm:** fill game farm + email → Continue → add rooster → Submit → success with Entry #.
5. **Existing farm:** search farm → Send verification code → enter OTP (check server log if test mode) → roosters.
6. Draft / closed event → “Registration closed”, no wizard.
7. Classic public open event → Register tab visible on public overview.

## Tests

- **Vitest:** `npm run test:run -- features/public/owner-verification.test.ts features/public/schema.test.ts` ✅
- **E2E:** `npx playwright test e2e/public-registration.spec.ts` (requires admin credentials + `REGISTRATION_OTP_TEST_MODE=true` recommended)

## Documentation

- **Admin / User docs:** N/A — nested `docs/admins` and `docs/users` repos not present in this workspace. When cloned, add:
  - `docs/users/docs/public-event-registration.md`
  - `docs/admins/docs/public-event-registration-admin.md`

## Suggested ClashPoint commit

**Summary:** Add staged public registration (game farm + roosters)

**Body:** Public Classic and Derby events now use a two-step registration wizard with email OTP for existing game farms. Adds Resend email, verification table migration, session cookie, and dashboard share link for all public events.

## Linear paste block

```
Title: Staged public registration (game farm + roosters)

Description:
Public events support two-step online registration: game farm (new or OTP-verified existing) then rooster submission. Works for Classic and Derby when event is public and Open. Dashboard share link shown for all public events.

Comment / instructions:
Run migration 202607151830_registration_owner_verifications. Set REGISTRATION_OTP_SECRET, RESEND_API_KEY, REGISTRATION_EMAIL_FROM. Optional REGISTRATION_OTP_TEST_MODE=true for local/E2E. Manual: mark event public + open → /events/{id}/register.

Documentation:
N/A until nested doc repos are updated
```
