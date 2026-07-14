# Event owner detail page

**Date:** 2026-07-14

## Summary

Organizers can open a read-only owner detail page from the event Owners tab. Click an owner name or **View** to see contact info, registration fee status, registered roosters, and payment history.

## Changelog (organizer-visible)

- **Owners list:** Owner name links to detail page; **View** button added per row.
- **Owner detail:** `/dashboard/events/{eventId}/owners/{entryId}` shows owner/handler/contact, registration status, fee summary, roosters, payments, and quick links (print slip, roosters, payments).

## Files touched

- `app/dashboard/events/[id]/owners/[entryId]/page.tsx`
- `features/entries/components/owner-detail-client.tsx`
- `features/entries/components/owners-list-client.tsx`

## Deploy steps

- App deploy only; no migration.

## Manual test steps

1. Open an event → **Owners**.
2. Click an owner name or **View**.
3. Confirm detail sections load; use **Back to owners**, **Add rooster**, **Print OWNER slip** (derby) as applicable.

## Tests

- **Build:** `npm run build` passed.
- **E2E:** N/A — extends existing owners navigation; manual click test sufficient unless event seed fixtures exist.

## Suggested commit

```
Add event owner detail page from Owners list

Clicking an owner opens a read-only summary with contact info, fee status,
registered roosters, and payment history within the event context.
```
