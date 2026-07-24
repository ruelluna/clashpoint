# Revolving fund balance RBAC — breakdown

**Date:** 2026-07-25

## Summary

Revolving fund balance amounts (current balance card and per-row running totals) are now visible only to System Owner roles (`admin`, `system_owner`). Event organizers still see the Revolving fund tab and ledger (type, date, description, transaction amounts) but balance data is omitted server-side and hidden in the UI.

Tab visibility is unchanged: Event Organizer and System Owner via `events.manage`; staff excluded via `staffExcluded`.

## Changelog

- **Balance card hidden** for Event Organizers on the Revolving fund page
- **Row running balance hidden** (`Balance: ₱…`) for Event Organizers
- **Server-side redaction** — `balanceAfter` stripped from ledger entries and balance query skipped for non-owners
- **System Owner / Admin** — unchanged full view (balance card + row balances)
- **Staff** — unchanged (tab hidden, direct URL blocked)

## Files touched

### app/

- `app/dashboard/events/[id]/revolving-fund/page.tsx` — `canViewBalance` from `isSystemOwnerRole`, conditional fetch/redact

### features/

- `features/revolving-fund/components/revolving-fund-client.tsx` — `canViewBalance` prop, conditional Balance card and row text

### e2e/

- `e2e/revolving-fund-access.spec.ts` — organizer balance hidden + admin balance visible tests

## Stage files

```bash
git add \
  app/dashboard/events/[id]/revolving-fund/page.tsx \
  features/revolving-fund/components/revolving-fund-client.tsx \
  e2e/revolving-fund-access.spec.ts \
  .cursor/breakdowns/20260725-0026-revolving-fund-balance-rbac-breakdown.md
```

## Deploy steps

No migration or env vars. Deploy app as usual.

## Manual test steps

1. Sign in as **Event Organizer** → open an event → **Revolving fund** tab.
   - Confirm ledger rows show transaction amounts.
   - Confirm **no** “Current balance” card and **no** “Balance: ₱…” under rows.
2. Sign in as **System Owner / Admin** → same page.
   - Confirm Balance card and per-row running balances appear.
3. Sign in as **Cashier staff** → confirm Revolving fund tab absent and `/revolving-fund` URL shows Access denied.

## E2E

```bash
npx playwright test e2e/revolving-fund-access.spec.ts
```

Requires `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` for organizer/staff tests; `PLAYWRIGHT_ADMIN_EMAIL` / `PLAYWRIGHT_ADMIN_PASSWORD` for admin balance test.

## Documentation

**Admin doc:** N/A — `docs/admins/` nested repo not present in workspace. When available, add a short note to the closest event-ops guide: Revolving fund tab for Event Organizer + System Owner; balance figures System Owner only.

## Suggested ClashPoint commit

```
Restrict revolving fund balance to system owners

Event organizers can view the ledger but not current or running
balances. Balance data is omitted server-side for non-owners.
```

## Commit commands

```bash
git commit -m "$(cat <<'EOF'
Restrict revolving fund balance to system owners

Event organizers can view the ledger but not current or running
balances. Balance data is omitted server-side for non-owners.
EOF
)"
```

## Linear paste block

```
Title: Restrict revolving fund balance to system owners

Description:
Event organizers can open the Revolving fund tab and browse the ledger (types, dates, descriptions, transaction amounts) but no longer see the current balance card or per-row running balances. System owners retain full balance visibility. Balance data is stripped server-side for organizers.

Comment / instructions:
No migration. Deploy app only. Manual test: organizer vs admin on Revolving fund tab; staff still blocked from tab and direct URL.

Documentation:
N/A (admin doc repo not updated in this pass)
```
