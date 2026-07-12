# Promoter create login checkbox fix

**Date:** 2026-07-12

## Summary

Fixed the non-interactive **Give this promoter portal login access** checkbox on the create promoter form. The Chakra UI v3 checkbox was missing `Checkbox.HiddenInput` and used a brittle `onCheckedChange` handler, so React state never updated and login fields stayed hidden. Checking the box now reveals inline **Grant login access** fields (login email + temporary password) before submit. Backend create-with-login was already wired; no schema or service changes.

## Changelog

- **Organizers:** On **Promoters → Add promoter**, the portal login checkbox toggles correctly and shows login email/password fields when checked.
- **Organizers:** Create form shows a **Grant login access** sub-section (matching the detail-page panel) when login is enabled at creation time.
- **Organizers:** Creating with login checked still links the auth user in one step; creating without login still shows **Grant login access** on the promoter detail page afterward.

## Files touched

### `features/`
- `features/promoters/components/promoter-form-client.tsx` — Chakra v3 checkbox fix, inline grant section heading/copy

### `e2e/`
- `e2e/promoters.spec.ts` — checkbox toggles grant fields on create form

## Deploy steps

None. Frontend-only change; no migrations or env vars.

## Manual test steps

1. Sign in as admin or organizer with promoter management access.
2. Open **Dashboard → Promoters → Add promoter** (`/dashboard/promoters/new`).
3. Fill **Name** and commission fields (defaults are fine).
4. Click **Give this promoter portal login access** — checkbox should check; **Grant login access**, **Login email**, and **Temporary password** appear.
5. Click the checkbox again — fields should hide and checkbox should uncheck.
6. Check the box again; enter login email and password (8+ characters); click **Create promoter**.
7. On the promoter detail page, confirm **Login access enabled** (or no **Grant login access** panel).
8. Create another promoter **without** the checkbox; confirm **Grant login access** panel appears on detail page.

## E2E

- Added: `e2e/promoters.spec.ts`
- Run: `npx playwright test e2e/promoters.spec.ts`
- Requires: `PLAYWRIGHT_ADMIN_EMAIL` and `PLAYWRIGHT_ADMIN_PASSWORD` in `.env.local` for the authenticated spec

## Vitest

N/A — UI-only fix; existing `features/promoters/schema.test.ts` covers login validation.

## Suggested ClashPoint commit

**Summary:** Fix promoter create login checkbox and inline grant fields

**Body:**

Chakra v3 checkbox was missing HiddenInput, so portal login toggle never updated state. Login email/password now appear on create when checked; backend create-with-login path was already wired.

## Suggested doc commits

N/A — no admin/user doc repos cloned in workspace.

## Linear paste block

```
Title: Fix promoter create login checkbox and inline grant fields

Description:
On Promoters → Add promoter, the portal login checkbox did not toggle or reveal login fields. Fixed Chakra v3 checkbox wiring (HiddenInput, onCheckedChange). When checked, Grant login access fields appear inline before Create promoter. Backend already supported create-with-login.

Comment / instructions:
No deploy steps. Manual test: /dashboard/promoters/new → toggle checkbox → fill login email/password → create → detail shows linked login. Run: npx playwright test e2e/promoters.spec.ts

Documentation:
N/A
```
