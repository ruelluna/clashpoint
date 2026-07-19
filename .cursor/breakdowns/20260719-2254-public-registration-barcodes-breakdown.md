# Public registration barcodes — breakdown

**Date:** 2026-07-19 22:54  
**Slug:** public-registration-barcodes

## Summary

Public online registration already assigned and saved `owner_barcode` / `cock_entry_barcode` on create. This change returns those barcodes after rooster submit, shows printable owner and cock slips on the **Registration submitted** screen, and adds a short-lived receipt cookie so participants can reopen `/events/[id]/register/labels` for about 30 minutes.

## Changelog

- After public rooster registration, participants see owner (`OWN-…`) and cock entry (`COCK-…`) barcode slips with Print slip / Print sticker.
- **Print / view labels** opens a receipt-gated labels page for the same browser session (~30 minutes).
- Barcodes remain stored on `entries.owner_barcode` and `rooster_event_registrations.cock_entry_barcode` (unchanged generation path).
- Staff can still reprint from the dashboard Owners / Roosters print flows.

## Files touched

### `app/`

- `app/events/[id]/register/page.tsx` — pass `entryFee` into wizard
- `app/events/[id]/register/labels/page.tsx` — new receipt-gated labels page

### `features/`

- `features/public/session-cookie.ts` — receipt cookie helpers
- `features/public/rooster-registration-service.ts` — return barcodes; set receipt; clear in-progress session
- `features/public/rooster-registration-service.test.ts` — unit coverage
- `features/public/actions.ts` — barcode fields on action state
- `features/public/queries.ts` — `getPublicRegistrationLabels`
- `features/public/types.ts` — barcode result types
- `features/public/components/public-registration-barcodes.tsx` — shared slips UI
- `features/public/components/public-registration-wizard.tsx` — complete screen shows slips

### `e2e/`

- `e2e/public-registration.spec.ts` — assert OWN-/COCK- and print affordances

### Docs (nested repos)

- `docs/users/docs/phase-10-public/viewing-public-events.md`
- `docs/admins/docs/phase-04-registration-payments/participant-registration.md`

## Deploy steps

- No Supabase migration
- No new env vars
- Deploy app as usual (Vercel)

## Manual test steps

1. Open a public event with registration open → `/events/{id}/register`.
2. Complete new game farm → rooster submit.
3. Confirm **Registration submitted** shows Entry #, band(s), owner barcode (`OWN-…`), cock barcode (`COCK-…`), and **Print slip**.
4. Click **Print / view labels** — slips load again.
5. In dashboard, open the entry Owners / Roosters print pages and confirm the same barcode values.

## E2E

- Updated: `e2e/public-registration.spec.ts`
- Run (when ready): `npx playwright test e2e/public-registration.spec.ts`

## Vitest

```bash
npm run test:run -- features/public/rooster-registration-service.test.ts
```

## Suggested ClashPoint commit

```
Summary: Present barcodes after public registration

Show saved owner and cock entry barcode slips on the public registration
success screen, with a short-lived receipt cookie for reprint labels.
```

## Suggested doc commits

**docs/users**

```
Summary: Document public registration barcode slips

Explain that online registrants can print owner and cock barcodes after submit.
```

**docs/admins**

```
Summary: Note online registrants receive owner/cock barcodes

Clarify that public registration issues the same barcodes staff print, with dashboard reprint still available.
```

## Linear paste block

```
Title: Present barcodes after public registration

Description:
Public registration already assigned OWN-/COCK- barcodes in the database. Registrants now see printable slips on the success screen and can reopen labels via a short-lived receipt cookie. Staff reprint from the dashboard remains unchanged.

Comment / instructions:
No migration. Manual test: complete public register → confirm OWN-/COCK- slips and Print / view labels. Optional: npx playwright test e2e/public-registration.spec.ts

Documentation:
Admin: {ADMIN_DOCS_URL}/phase-04-registration-payments/participant-registration
User: {USER_DOCS_URL}/phase-10-public/viewing-public-events
```
