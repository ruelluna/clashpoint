# Revolving Fund Ledger: Recent-first + Search

**Date:** 2026-07-20

## Summary

The event revolving fund ledger now lists entries newest-first and includes a client-side search field inside the Ledger panel only. Organizers can quickly find recent activity and filter by type, description, date, or amount without affecting the Balance or Record adjustment sections.

## Changelog

- Ledger entries display from most recent to oldest (by `created_at`).
- Search input added inside the Ledger card; filters by entry type, description, date, and amount/balance.
- Empty search results show “No ledger entries match this search.” separately from an empty ledger.

## Files touched

### features/

- `features/revolving-fund/service.ts` — reverse default ledger sort to `created_at DESC`
- `features/revolving-fund/components/revolving-fund-client.tsx` — ledger search state, filter, and UI

## Stage files

```bash
git add \
  features/revolving-fund/service.ts \
  features/revolving-fund/components/revolving-fund-client.tsx \
  .cursor/breakdowns/20260720-1335-revolving-fund-ledger-search-breakdown.md
```

## Deploy steps

None. No migration or env var changes.

## Manual test steps

1. Open **Dashboard → Events → [event with ledger activity] → Revolving fund**.
2. Confirm the top ledger row is the most recent transaction (not the opening entry).
3. In the Ledger search box, type part of a description — only matching rows remain.
4. Search for an entry type (e.g. `Collection`) or an amount — list narrows accordingly.
5. Clear the search — full list returns, still newest-first.
6. Search for nonsense text — “No ledger entries match this search.” appears; Balance and Record adjustment panels are unchanged.

## E2E

N/A — UI-only client filter and sort display change; existing `e2e/revolving-fund-access.spec.ts` covers access control only.

## Vitest

N/A — no schema or business-rule change beyond query sort order.

## Docs

N/A — no revolving fund doc pages in cloned nested doc repos.

## Suggested ClashPoint commit

```
Sort revolving fund ledger newest-first and add ledger search

Organizers see recent ledger activity at the top and can filter
entries inside the Ledger panel by type, description, date, or amount.
```

## Commit commands

```bash
git commit -m "$(cat <<'EOF'
Sort revolving fund ledger newest-first and add ledger search

Organizers see recent ledger activity at the top and can filter
entries inside the Ledger panel by type, description, date, or amount.
EOF
)"
```

## Linear paste block

```
Title: Sort revolving fund ledger newest-first and add ledger search

Description:
- Ledger on Events → Revolving fund lists entries from most recent to oldest.
- Search field inside the Ledger panel filters by type, description, date, or amount.
- No-match search shows a dedicated message without affecting Balance or adjustments.

Comment / instructions:
No deploy steps. Manual test: open an event revolving fund page with several entries, confirm newest is first, use Ledger search to filter and clear.

Documentation:
N/A
```
