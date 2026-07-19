# Revolving fund staff access — breakdown

**Date:** 2026-07-20

## Summary

Staff users no longer see the **Revolving fund** event tab and cannot open the route or record adjustments, even when assigned Cashier Terminal or Events modules. Event organizers and admins retain access via `events.manage`. Cashier payment flows that post ledger entries in the background are unchanged (no RLS migration).

## Changelog

- **Revolving fund tab hidden** for all `staff` role users on event detail pages
- **Direct URL blocked** — `/dashboard/events/{id}/revolving-fund` redirects staff to access denied
- **Adjustments blocked** — `recordRevolvingFundAdjustmentAction` requires non-staff `events.manage`
- Event organizers and admins can still view balance, ledger, and record adjustments

## Files touched

### lib/

- `lib/auth/permissions.ts` — `requireNonStaffAnyPermission`
- `lib/auth/event-tabs.ts` — `staffExcluded` on revolving fund; `events.manage` only
- `lib/auth/event-tabs.test.ts` — tab visibility tests
- `lib/auth/permissions.test.ts` — non-staff guard test

### app/

- `app/dashboard/events/[id]/revolving-fund/page.tsx` — page guard

### features/

- `features/revolving-fund/actions.ts` — action guard

### e2e/

- `e2e/revolving-fund-access.spec.ts` — staff tab hidden + direct URL denied
- `e2e/helpers/test-users.ts` — `createCashierStaffTestUser`

## Stage files

```bash
git add \
  lib/auth/permissions.ts \
  lib/auth/event-tabs.ts \
  lib/auth/event-tabs.test.ts \
  lib/auth/permissions.test.ts \
  app/dashboard/events/[id]/revolving-fund/page.tsx \
  features/revolving-fund/actions.ts \
  e2e/revolving-fund-access.spec.ts \
  e2e/helpers/test-users.ts \
  .cursor/breakdowns/20260720-0149-revolving-fund-staff-access-breakdown.md
```

## Deploy steps

None — app-only change. No migration or env vars.

## Manual test steps

1. Sign in as **staff** with Cashier Terminal → open an event → confirm **Revolving fund** tab is absent; **Cashier Terminal** tab still visible
2. Navigate directly to `/dashboard/events/{id}/revolving-fund` → **Access denied**
3. Sign in as **event organizer** → **Revolving fund** tab visible; ledger and adjustment form work
4. As staff cashier, collect a payment → still succeeds

## Tests

**Vitest:**

```bash
npm run test:run -- lib/auth/event-tabs.test.ts lib/auth/permissions.test.ts
```

**E2E:**

```bash
npx playwright test e2e/revolving-fund-access.spec.ts
```

Requires `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.

## E2E

- Added `e2e/revolving-fund-access.spec.ts`

## Docs

N/A — cashier user doc does not reference the Revolving fund tab.

## Suggested ClashPoint commit

```
Hide revolving fund from staff users

Staff no longer see the Revolving fund event tab or can open the route
directly. Organizers and admins retain access via events.manage; cashier
ledger posts during payment collection are unchanged.
```

## Commit commands

```bash
git commit -m "$(cat <<'EOF'
Hide revolving fund from staff users

Staff no longer see the Revolving fund event tab or can open the route
directly. Organizers and admins retain access via events.manage; cashier
ledger posts during payment collection are unchanged.
EOF
)"
```

## Linear paste block

```
Title: Hide revolving fund from staff users

Description:
Staff no longer see the Revolving fund event tab on event pages. Direct navigation to the revolving fund route and manual adjustment actions redirect staff to access denied. Event organizers and admins retain full access.

Comment / instructions:
No migration or env changes. Test: staff with Cashier Terminal → no tab, direct URL → access denied; organizer → tab visible; staff payment collection still works.

Documentation:
N/A
```
