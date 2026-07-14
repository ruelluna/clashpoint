# Handler to rooster contact — breakdown

**Date:** 2026-07-14

## Summary

Moved handler from event owner registration to each rooster registration. Owner registration now collects structured contact information (Full Name, Designation, Phone, Email) synced to both entries and saved competitors profiles.

## Changelog

- Owner registration forms show Contact information (full name, designation, phone, email) instead of a handler field
- Handler name is optional on each rooster slot (staff and public registration)
- Owner list, detail, reports, and OWNER barcode slip show contact person instead of handler
- Saved owner directory stores contact full name and designation
- Duplicate (event_id, competitor_id) rows are soft-deleted before the unique index is applied (migration fix)

## Deploy steps

1. Apply Supabase migrations: supabase db push --local (or remote)
2. Migration 202607142000 soft-deletes duplicate active entries per (event_id, competitor_id) before unique index
3. No new env vars

## Manual test

- Event → Owners → Register owner (contact fields, no handler)
- Event → Rooster Entries → handler per cock slot
- Public /events/{id}/register
- Duplicate owner per event blocked

## Tests

npm run test:run
npx playwright test e2e/event-owners.spec.ts
npx playwright test e2e/public-registration.spec.ts
npm run build

## Suggested commit

Move handler to rooster entry; add owner contact fields

Owner registration collects contact person details synced to saved owners.
Handler is stored per rooster registration. Migration dedupes competitor-linked entries before unique index.
