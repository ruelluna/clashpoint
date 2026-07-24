# Short scan codes (canonical barcodes kept)

**Date:** 2026-07-24

## Summary

Stickers and USB scans use short deterministic codes (`O0001` / `C0001` / `B0042M`) stored in new columns. Canonical `OWN-` / `COCK-` / `BET-` barcodes remain for slips, UI, and audit. Scan lookups accept either form for the current event.

## Changelog

- New DB columns: `entries.owner_scan_code`, `rooster_event_registrations.cock_scan_code`, `match_bets.scan_code` (unique per event)
- Create paths assign canonical + short together; migration backfills existing rows
- Stickers encode short scan codes; slips keep full barcodes
- Cashier, matching, inspection, and owners scan accept short or canonical
- USB idle auto-submit recognizes short patterns

## Files touched

### supabase/

- `migrations/20260724073644_short_scan_codes.sql`

### lib/

- `supabase/database.types.ts`

### features/

- `entries/schema.ts`, `schema.test.ts`, `barcode-scan-utils.ts`, `barcode-scan-utils.test.ts`, `service.ts`, `queries.ts`, `types.ts`
- `matches/schema.ts`, `schema.test.ts`, `service.ts`, `queries.ts`, `client-mapper.ts`, `types.ts`
- `weighing/service.ts`, `service.test.ts`
- `inspection/queries.ts`
- `payments/dues.ts`, `dues.test.ts`, `service.ts`
- `printing/components/owner-barcode-slip.tsx`, `cock-entry-barcode-slip.tsx`, `match-bet-barcode-slip.tsx`
- `public/*` (labels wiring for scan codes)

### app/

- owners / roosters / matching print pages; public register labels page

### hooks/, scripts/, e2e/

- `hooks/use-barcode-scan-input.test.ts`
- `scripts/lib/seed-demo-shared.mjs`
- `e2e/event-owners.spec.ts` — short scan lookup

## Stage files

```bash
git add \
  supabase/migrations/20260724073644_short_scan_codes.sql \
  lib/supabase/database.types.ts \
  features/entries/schema.ts \
  features/entries/schema.test.ts \
  features/entries/barcode-scan-utils.ts \
  features/entries/barcode-scan-utils.test.ts \
  features/entries/service.ts \
  features/entries/queries.ts \
  features/entries/types.ts \
  features/matches/schema.ts \
  features/matches/schema.test.ts \
  features/matches/service.ts \
  features/matches/queries.ts \
  features/matches/client-mapper.ts \
  features/matches/types.ts \
  features/matches/utils.test.ts \
  features/matches/pledge-settlement-service.test.ts \
  features/matches/matching-realtime-patches.test.ts \
  features/weighing/service.ts \
  features/weighing/service.test.ts \
  features/inspection/queries.ts \
  features/payments/dues.ts \
  features/payments/dues.test.ts \
  features/payments/service.ts \
  features/printing/components/owner-barcode-slip.tsx \
  features/printing/components/cock-entry-barcode-slip.tsx \
  features/printing/components/match-bet-barcode-slip.tsx \
  features/public/types.ts \
  features/public/queries.ts \
  features/public/rooster-registration-service.ts \
  features/public/rooster-registration-service.test.ts \
  features/public/actions.ts \
  features/public/components/public-registration-barcodes.tsx \
  features/public/components/public-registration-wizard.tsx \
  app/dashboard/events/[id]/owners/[entryId]/print/page.tsx \
  app/dashboard/events/[id]/roosters/[registrationId]/print/page.tsx \
  app/dashboard/events/[id]/matching/[matchId]/print/page.tsx \
  app/events/[id]/register/labels/page.tsx \
  hooks/use-barcode-scan-input.test.ts \
  scripts/lib/seed-demo-shared.mjs \
  e2e/event-owners.spec.ts \
  .cursor/breakdowns/20260724-1542-short-scan-codes-breakdown.md
```

## Deploy steps

1. Apply migration: `supabase db push` (or run `20260724073644_short_scan_codes.sql` in the dashboard).
2. Deploy app (Vercel). No new env vars.

## Manual test steps

1. Register an owner → print page: slip shows `OWN-…`; switch to sticker → barcode/caption shows `O####`.
2. On Owners list, scan `O####` → opens the same owner as `OWN-…`.
3. Add a cock → sticker shows `C####`; Matching/Inspection/Cashier accept `C####` or `COCK-…`.
4. Create a match → pledge sticker shows `B####M` / `B####W`; Cashier accepts short or `BET-…`.

## E2E

- Added: `e2e/event-owners.spec.ts` — `looks up owner by short scan code`
- Run: `npx playwright test e2e/event-owners.spec.ts`
- Vitest: `npm run test:run -- features/entries/schema.test.ts features/entries/barcode-scan-utils.test.ts features/matches/schema.test.ts features/payments/dues.test.ts`

## Docs

- Admin docs N/A — `docs/admins` not cloned in this workspace.
- When publishing admin guides: note stickers use short codes; slips keep full barcodes; scan accepts either.

## Suggested ClashPoint commit

```
Add short scan codes for stickers while keeping canonical barcodes

Stickers and USB scans use compact O/C/B codes; OWN-/COCK-/BET- remain
for slips and audit. Lookups accept either form per event.
```

## Commit commands

```bash
git commit -m "$(cat <<'EOF'
Add short scan codes for stickers while keeping canonical barcodes

Stickers and USB scans use compact O/C/B codes; OWN-/COCK-/BET- remain
for slips and audit. Lookups accept either form per event.
EOF
)"
```

## Linear paste block

```
Title: Add short scan codes for stickers while keeping canonical barcodes

Description:
Stickers print short event-scoped codes (O0001 / C0001 / B0042M) stored alongside canonical OWN-/COCK-/BET- barcodes. Slips and audit keep the long form. Cashier, matching, inspection, and owners accept either on scan.

Comment / instructions:
Apply migration 20260724073644_short_scan_codes.sql before or with deploy. Manual: print sticker vs slip, scan short code on Owners/Cashier. E2E: npx playwright test e2e/event-owners.spec.ts

Documentation:
N/A (admin docs repo not present)
```
