# Event owners search, scan, and duplicate prevention

**Date:** 2026-07-14

## Summary

Event Owners tab now supports text search and derby OWNER barcode lookup (USB scanner input, camera dialog, and optional `?barcode=` deep link). Registration enforces **one owner per event**.

## Changelog

- Owners list: search by owner, handler, entry #, contact, or barcode
- Derby events: scan field, camera scan dialog, barcode on list rows
- `?barcode=OWN-…` redirects to matching entry
- One owner per event (competitor_id or normalized name)
- DB partial unique index on `(event_id, competitor_id)`

## Deploy steps

Apply `supabase/migrations/202607142000_entries_event_competitor_unique.sql`.

## Manual test

Owners tab ? search/scan ? duplicate owner registration blocked.

## E2E

`npx playwright test e2e/event-owners.spec.ts`

## Suggested commit

Add event owners search/scan and one-owner-per-event rule
