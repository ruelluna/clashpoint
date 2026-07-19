# Cashier Terminal Enhancement

**Date:** 2026-07-20

## Summary

Per-staff cashier sessions with opening float, session-scoped payments, admin read-only terminal and matching, optional receipts, admin handover recording, and an admin-only Global Transactions page.

## Changelog

- Renamed **Derby payments** module and event tab to **Cashier Terminal**
- Staff open sessions with opening float before transacting; payments tied to sessions
- Receipts and terminal show cashier name and Philippines time; print is optional
- Admins read-only on Cashier Terminal and Matching
- Admin handovers recorded by staff replenish revolving fund
- New `/dashboard/transactions` for admins (active event default, event filter)

## Stage files

```bash
git add \
  supabase/migrations/202607200100_cashier_sessions.sql \
  lib/supabase/database.types.ts \
  lib/auth/modules.ts \
  lib/auth/event-tabs.ts \
  lib/auth/permissions.ts \
  lib/auth/index.ts \
  lib/auth/operational-access.ts \
  lib/auth/operational-access.test.ts \
  lib/format/datetime.ts \
  lib/dashboard/nav.ts \
  lib/dashboard/nav.test.ts \
  features/cashier-sessions/types.ts \
  features/cashier-sessions/schema.ts \
  features/cashier-sessions/schema.test.ts \
  features/cashier-sessions/queries.ts \
  features/cashier-sessions/service.ts \
  features/cashier-sessions/actions.ts \
  features/transactions/types.ts \
  features/transactions/queries.ts \
  features/transactions/display-utils.ts \
  features/transactions/components/global-transactions-client.tsx \
  features/payments/types.ts \
  features/payments/service.ts \
  features/payments/actions.ts \
  features/payments/components/cashier-client.tsx \
  features/payments/components/cashier-terminal-clock.tsx \
  features/payments/components/cashier-open-session-form.tsx \
  features/payments/components/cashier-handover-form.tsx \
  features/payments/components/cashier-close-session-form.tsx \
  features/printing/components/payment-receipt-slip.tsx \
  features/revolving-fund/service.ts \
  features/revolving-fund/types.ts \
  features/events/schema.ts \
  features/events/actions.ts \
  features/events/service.ts \
  features/events/queries.ts \
  features/events/types.ts \
  features/events/components/event-form-client.tsx \
  features/events/components/event-detail-tabs.tsx \
  app/dashboard/events/[id]/payments/page.tsx \
  app/dashboard/events/[id]/matching/page.tsx \
  app/dashboard/events/[id]/payments/[paymentId]/print/page.tsx \
  app/dashboard/transactions/page.tsx \
  e2e/cashier.spec.ts \
  .cursor/breakdowns/20260720-0040-cashier-terminal-enhancement-breakdown.md
```

Docs repo (stage separately): `docs/admins/docs/cashier-terminal-admin.md`, `docs/users/docs/cashier-terminal.md`

## Commit commands

```bash
git commit -m "$(cat <<'EOF'
Add cashier sessions and Global Transactions

Staff open terminal sessions with opening float before payments; admins
get read-only terminal/matching and a Global Transactions ledger scoped
to the active event.
EOF
)"
```

## Deploy steps

Apply migration `202607200100_cashier_sessions.sql` via Supabase CLI or dashboard.

## Manual test

Organizer: Cashier Terminal → Start session → collect payment → optional print → End access. Admin: read-only terminal + Transactions page.

## E2E

```bash
npx playwright test e2e/cashier.spec.ts
```
