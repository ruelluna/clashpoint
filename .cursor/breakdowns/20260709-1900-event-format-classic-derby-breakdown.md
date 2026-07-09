# Event Format: Classic vs Derby

**Date:** 2026-07-09

## Summary

Added a new `event_format` field (Classic vs Derby) to the existing event creation/edit flow. Classic events are single weight-matched bouts with exactly one cock per entry and no derby type; Derby events keep the existing multi-cock behavior with a derby type. The event form conditionally shows/hides the Derby type and Cocks-per-entry inputs based on the selected format, and validation plus a DB check constraint enforce the rules.

## Changelog

- New event format selector on the New/Edit event form: choose **Classic** or **Derby**.
- Selecting **Classic** hides the Derby type and Cocks-per-entry fields and stores 1 cock per entry with no derby type.
- Selecting **Derby** keeps the existing Derby type and Cocks-per-entry inputs.
- Event list, dashboard event overview, and public event pages now show the format (and only show the derby type for derby events).
- Server-side validation rejects derby events without a derby type and classic events with more than one cock per entry; a DB check constraint enforces the same integrity.

## Files touched

- `app/`
  - `app/dashboard/events/[id]/page.tsx` — show format, guard derby type render
  - `app/events/[id]/page.tsx` — public detail shows format instead of raw derby type
- `features/`
  - `features/events/schema.ts` — `eventFormatSchema`, `eventFormat` field, refine rules, `EVENT_FORMAT_LABELS`
  - `features/events/types.ts` — `EventFormat`, `event_format` on rows, nullable `derby_type`
  - `features/events/service.ts` — `toEventInsert` handles format (classic forces cocks=1, null derby type), audit log adds format
  - `features/events/actions.ts` — parse `eventFormat`, defensive classic overrides
  - `features/events/queries.ts` — select + map `event_format`, nullable derby type
  - `features/events/components/event-form-client.tsx` — format selector + conditional fields
  - `features/events/components/events-list-client.tsx` — format label + guarded derby type
  - `features/events/schema.test.ts` — new Vitest coverage
  - `features/public/types.ts`, `features/public/queries.ts`, `features/public/components/public-events-list.tsx` — carry format, guard derby type
  - `features/reports/queries.ts` — coerce nullable derby type to string
- `supabase/`
  - `supabase/migrations/202607091830_event_format.sql` — enum, column, nullable derby type, check constraint
- `lib/`
  - `lib/supabase/database.types.ts` — `event_format` enum/column, nullable `derby_type`
- `e2e/`
  - `e2e/events.spec.ts` — new Playwright specs

## Deploy steps

Apply migration `202607091830_event_format.sql` (e.g. `supabase db push` or run in the Supabase dashboard). Existing events default to `derby`, preserving current behavior. No new env vars.

## Manual test

1. Open `/dashboard/events/new`.
2. Switch **Event format** to **Classic** — Derby type and Cocks-per-entry fields disappear.
3. Submit — event is created with `event_format=classic`, `cocks_per_entry=1`, `derby_type` null; redirect to the event detail shows "Classic".
4. Create another event with **Derby** — Derby type and Cocks-per-entry fields are shown and behave as before.
5. Verify the events list and public event page display the format correctly.

## Vitest

```
npm run test:run -- features/events/schema.test.ts
```

## E2E

```
npx playwright test e2e/events.spec.ts
```

Requires `PLAYWRIGHT_ADMIN_EMAIL` and `PLAYWRIGHT_ADMIN_PASSWORD`; specs skip when unset.

## Docs

Admin/User docs: N/A in this pass — the nested `docs/admins/` and `docs/users/` repos are not cloned in this workspace. When updating, add a note to the admin event-management guide explaining the Classic vs Derby choice using in-app wording only (no CLI).

## Suggested ClashPoint commit

Summary: Add Classic vs Derby event format to event creation

Body: Introduce an `event_format` enum (classic/derby) alongside the existing event type. Classic events store one cock per entry and no derby type; the event form conditionally hides derby fields. Validation and a DB check constraint enforce the rules, and display surfaces show the format.

## Linear paste block

```
Title: Add Classic vs Derby event format to event creation

Description:
Events can now be created as Classic (single weight-matched bouts, one cock per entry) or Derby (existing multi-cock format). A new event_format field drives conditional form fields, validation, and a DB check constraint. Existing events default to Derby.

Comment / instructions:
Apply Supabase migration 202607091830_event_format.sql after deploy. No new env vars. Test: /dashboard/events/new -> toggle Event format Classic/Derby -> derby fields hide/show -> create -> confirm detail page shows the format.

Documentation:
N/A this pass (nested doc repos not present).
```
