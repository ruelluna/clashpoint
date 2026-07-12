# Dynamic entry fields breakdown

Date: 2026-07-12

## Summary

Rooster entry create is now minimal (entry name, band, weight, color/marking). Full registry profile and event banding fields appear on **Edit rooster entry**. Breed, bloodline, and color/marking use searchable comboboxes backed by a `reference_values` catalog. Category was removed from entry forms.

## Changelog

- New rooster entry: only entry name, band number, weight (g), and color/marking (searchable)
- Edit rooster entry: registry profile (age class, breed, bloodline, origin, hatch date, etc.) plus event banding when configured
- Breed, bloodline, and color/marking: type to search existing values or enter a new one (saved to catalog on submit)
- Category field removed from entry create and edit
- Derby eligibility policy validation runs on edit (and weight-only on create), not full policy on create

## Deploy steps

1. Apply Supabase migration: `supabase db push` or run `202607121709_reference_values.sql` in the dashboard
2. Deploy app (Vercel) as usual — no new env vars

## Manual test steps

1. **Events → Rooster entries → New rooster entry**: confirm only name, band, weight, color/marking per cock
2. Save; open **Edit** and complete breed, bloodline, age class, origin, banding as needed
3. Combobox: search existing breed; type new value, save, reopen and confirm search finds it
4. Derby + weight limits: below-min weight blocked on create; full policy blocked on edit until fixed

## Tests

- Vitest: `npm run test:run`
- E2E: `npx playwright test e2e/rooster-entry-eligibility.spec.ts`

## Suggested ClashPoint commit

**Summary:** Add dynamic breed/bloodline/color catalogs and split entry create vs edit fields

**Body:** Entry create stays minimal; registry profile and eligibility on edit. reference_values powers combobox search/add. Category removed from entry UI.
