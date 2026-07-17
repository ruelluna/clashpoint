# Classic event barcode scan parity

**Date:** 2026-07-17

## Summary

Classic events now get the same owner and cock entry barcodes as derby, with scan UI, deep links, print actions, and post-create print redirects. Derby-only fee snapshots and eligibility apply remain unchanged. No backfill for existing classic rows.

## Changelog

- New classic owner registrations receive `OWN-…` barcodes; new roosters receive `COCK-…` barcodes
- Owners, Roosters, and Inspection tabs show barcode scan rows for classic events
- `?barcode=` deep links work on `/owners`, `/roosters`, and `/inspection` for classic
- Print OWNER / cock entry slip buttons and post-create print redirects apply to classic
- Existing classic entries/roosters created before this change still have `null` barcodes (no backfill)

## Files touched

### features/

- `entries/service.ts` — always assign `owner_barcode`; `fee_snapshot` still derby-only
- `entries/actions.ts` — redirect to owner print when barcode assigned
- `entries/components/owners-list-client.tsx` — scan + print for all events
- `entries/components/owner-detail-client.tsx` — print buttons when barcode exists
- `weighing/service.ts` — always assign `cock_entry_barcode`
- `weighing/actions.ts` — redirect to cock print after add rooster
- `event-roosters/components/event-roosters-client.tsx` — scan row + print slip for all
- `inspection/components/inspection-station-client.tsx` — cock barcode scan for all

### app/

- `dashboard/events/[id]/owners/page.tsx` — classic `?barcode=` redirect
- `dashboard/events/[id]/roosters/page.tsx` — classic `?barcode=` pre-select entry
- `dashboard/events/[id]/inspection/page.tsx` — classic `?barcode=` highlight

### tests/

- `features/entries/service.test.ts` — classic `createEntry` barcode + no fee snapshot
- `features/weighing/service.test.ts` — classic cock barcode on insert
- `e2e/event-roosters-owner-scan.spec.ts` — classic owner scan + add rooster case

## Deploy steps

No migration. Deploy app only.

## Manual test steps

1. Create **classic** open event → Register owner → lands on OWNER print with `OWN-…`
2. **Owners** → scan row visible → scan navigates to owner detail
3. **Roosters** → scan OWNER barcode → add rooster → lands on COCK print
4. Enable physical inspection → **Inspection** → scan COCK barcode highlights row
5. Confirm derby event scan flow still works

## E2E

- Updated: `e2e/event-roosters-owner-scan.spec.ts` (classic case added)
- Run: `npx playwright test e2e/event-roosters-owner-scan.spec.ts`

## Tests run

```bash
npm run test:run   # 314 passed
npm run build      # success
```

## Documentation

N/A — same in-app scan workflow extended to classic events.

## Suggested ClashPoint commit

**Summary:** Enable barcode scan and slips for classic events

**Body:**

Assign owner and cock entry barcodes for classic registrations, show scan UI on Owners/Roosters/Inspection, enable barcode deep links and print redirects, without changing derby fee or eligibility behavior. Existing classic rows without barcodes are unchanged.

## Linear paste block

```
Title: Enable barcode scan and slips for classic events

Description:
Classic events now generate OWN and COCK barcodes on registration, with the same scan rows, print slips, and ?barcode= deep links as derby. Derby fee snapshots and post-create eligibility remain derby-only. No backfill for legacy classic rows.

Comment / instructions:
Deploy app only. Test classic owner register → print → roosters scan → add rooster → inspection scan. E2E: npx playwright test e2e/event-roosters-owner-scan.spec.ts

Documentation:
N/A
```
