# Dashboard breathable spacing

**Date:** 2026-07-12

## Summary

Increased vertical and internal spacing on three event dashboard pages (Overview, Registrations, Payments) so sections, cards, rows, and form fields have more breathing room. Aligns dashboard event pages with the more generous spacing used on the public event page.

## Changelog

- Event overview: wider gaps between status bar and detail cards; event details and prize structure cards use p={6} with looser row spacing
- Registrations: header and filter grouped together; larger gap before the table; table rows and inline actions less cramped
- Payments: record-payment form, payment table, and entry summary card use consistent, more breathable vertical rhythm

## Files touched

### app/
- app/dashboard/events/[id]/page.tsx

### features/
- features/entries/components/entries-list-client.tsx
- features/payments/components/payments-ledger-client.tsx

## Deploy steps

None — UI-only spacing changes. Deploy via normal Vercel promotion.

## Manual test steps

1. Open /dashboard/events/{id} — confirm Event details rows and Prize structure tiers are not stacked tightly; cards have comfortable padding
2. Open /dashboard/events/{id}/registrations — confirm clear space between filter row and table; table rows feel less cramped
3. Open /dashboard/events/{id}/payments — confirm form labels, fields, table rows, and summary list have even vertical spacing

## E2E

N/A — spacing-only UI polish with no behavior change.

## Suggested ClashPoint commit

Summary: Improve breathable spacing on event dashboard pages

Increase card padding, section gaps, row spacing, and form label margins on event overview, registrations, and payments pages for easier scanning.

## Suggested doc commits

N/A — no admin or user docs updated.

## Linear paste block

Title: Improve breathable spacing on event dashboard pages

Description:
Event overview, registrations, and payments pages now use looser vertical spacing between sections, cards, rows, and form fields. No behavior changes.

Comment / instructions:
No migration or env vars. Reload the three event sub-pages and confirm sections feel less cramped.

Documentation:
N/A
## Changelog update (2026-07-12)

- Fixed card gaps not rendering: Tailwind space-y-* on Chakra Box does not apply child margins; replaced with Chakra Flex direction=column gap={8} on event overview, registrations, payments, event tabs, and page wrappers
