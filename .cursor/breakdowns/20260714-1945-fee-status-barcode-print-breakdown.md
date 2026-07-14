# Fee status conformance + barcode print layout

**Date:** 2026-07-14

## Summary

Owners and roosters no longer show **Unpaid** when the corresponding event fee toggle is disabled. New owner entries get `payment_status: paid` when registration fee is off. Barcode slips are centered within their container, and owner/cock print pages offer **Print slip** (existing layout) and **Print sticker** (50mm x 25mm hand-roller label).

## Changelog (organizer-visible)

- **Owners list:** Registration fee badge shows **Not required** when registration fee is disabled on the event (uses entry `fee_snapshot` when present, else current event settings).
- **Roosters list:** Entry fee badge follows the same rules via shared display helpers.
- **Payments ledger:** Owner registration rows that do not require payment are excluded from payable entry selection; summary labels use the same helper.
- **New owner registration:** When registration fee is disabled, new entries are created with payment status **paid** (not **unpaid**).
- **Print pages (owner + cock entry):** Barcode is centered and constrained to the slip width; **Print slip** and **Print sticker** buttons; sticker uses compact layout and `@page size: 50mm 25mm`.

## Files touched

### features/

- `entries/service.ts` - set `payment_status` from `registrationFeeEnabled` on create
- `entries/types.ts` - `fee_snapshot` on `EntryListItem`
- `entries/queries.ts` - select `fee_snapshot` in list query
- `entries/components/owners-list-client.tsx` - client list with payment display helper
- `payments/display-utils.ts` - `getOwnerRegistrationPaymentDisplay`, `getRoosterEntryPaymentDisplay`, etc.
- `payments/display-utils.test.ts` - Vitest for fee-off vs fee-on labels
- `payments/components/payments-ledger-client.tsx` - payable filter + labels
- `event-roosters/components/event-roosters-client.tsx` - rooster payment badge via helper
- `printing/components/barcode-label.tsx` - ResizeObserver, centered SVG, `size` prop
- `printing/print-format-context.tsx` - `PrintFormatProvider` / `usePrintFormat`
- `printing/components/print-slip-layout.tsx` - dual print buttons + print CSS
- `printing/components/owner-barcode-slip.tsx` - slip vs sticker layouts
- `printing/components/cock-entry-barcode-slip.tsx` - slip vs sticker layouts

### app/

- `dashboard/events/[id]/owners/page.tsx` - uses `OwnersListClient`
- `dashboard/events/[id]/roosters/page.tsx` - passes `feeSettings`

## Deploy steps

- No Supabase migration required.
- Deploy app (Vercel) as usual.
- Existing DB rows may still have `payment_status: unpaid` when fee was disabled at create time; UI shows **Not required** via display helpers. Optional backfill not included.

## Manual test steps

1. **Registration fee off (derby):** Edit event, disable registration fee, save. Open **Owners** - badge should read **Not required**, not **Unpaid**. Register a new owner - badge **Not required** / status paid.
2. **Registration fee on:** Enable registration fee - new owner shows **Unpaid** until payment recorded.
3. **Entry fee off:** Disable entry fee - **Roosters** list shows **Not required** for entry payment.
4. **Payments:** Open **Payments** - entries without required registration fee should not appear as payable for registration category.
5. **Owner print:** `/dashboard/events/{id}/owners/{entryId}/print` - barcode centered; **Print slip** full layout; **Print sticker** compact 50x25mm preview.
6. **Cock print:** rooster registration print route - same slip/sticker behavior.

## Tests

- **Vitest:** `npm run test:run` - 261 tests passed (includes `display-utils.test.ts`).
- **Build:** `npm run build` - passed.
- **E2E:** N/A - display/print UX; manual print verification recommended.

## Suggested ClashPoint commit

```
Summary: Align fee badges with toggles and add barcode sticker print

When registration or entry fees are disabled, owners/roosters/payments UI
shows Not required instead of Unpaid; new owners get paid status when
registration fee is off. Barcode slips center in container; Print sticker
adds 50x25mm layout for owner and cock entry slips.
```

## Admin / user docs

- N/A - in-app UX and print layout only.

## Linear paste block

```
Title: Align fee badges with toggles and add barcode sticker print

Description:
- Owners/roosters/payments show Not required when the matching fee toggle is off
- New owner entries created with paid status when registration fee disabled
- Owner and cock barcode print: centered barcode, Print slip + Print sticker (50x25mm)

Comment / instructions:
No migration. Deploy app. Test: derby event with registration fee off -> Owners Not required; print pages -> slip vs sticker.

Documentation:
N/A
```
