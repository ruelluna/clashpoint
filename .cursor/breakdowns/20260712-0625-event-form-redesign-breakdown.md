# Event Form Redesign — Breakdown

**Date:** 2026-07-12

## Summary

Redesigned event creation and editing: **Event type** is now Classic or Derby (replacing separate format and business-type fields). Added **tax per fight** and derby-only **registration rules** (WYSIWYG). Venue moved to **Dashboard → Settings**. Removed form fields for scoring, draw/tie rules, house/venue deductions, entry/weight limits, and guaranteed prize.

## Changelog

- Event type is Classic or Derby only; old House/Sponsored categories removed
- Tax per fight on all events; registration rules WYSIWYG on derby events
- Derby-only: registration deadline, promoter, derby type (2–5-Cock, Custom), prize structure
- Cocks per entry input only when Derby type is Custom
- Default venue set in Settings; auto-applied on create/update
- Prize pool = gross collection minus promoter commission (no house/venue/guarantee deductions in UI)
- Public event page shows registration rules and tax per fight for derby events

## Deploy steps

1. Apply migration: `supabase db push` or run `202607121200_event_form_redesign.sql` in the Supabase dashboard
2. **Dashboard → Settings** — set **Default venue name**
3. Deploy app (includes new TipTap dependencies)

## Manual test steps

1. **Settings** — Set default venue, save, confirm it persists
2. **New Classic event** — Only name, date, type, fees, tax, flags; no derby fields; create succeeds
3. **New Derby event** — Fill registration deadline, promoter, derby type, prize tiers, registration rules; create succeeds
4. **Custom derby** — Select Custom, enter cocks per entry; save and verify on event detail
5. **Public page** — Open a public derby event; confirm registration rules HTML and tax per fight

## Tests

- Vitest: `npm run test:run` (124 passed)
- E2E: `npx playwright test e2e/events.spec.ts`

## Suggested ClashPoint commit

Summary: Redesign event create form (Classic/Derby type, tax per fight)

Consolidates event format and business type into Classic/Derby, adds derby-only registration rules and tax per fight, moves venue to system settings, and drops legacy scoring and prize-deduction fields from the organizer form.
