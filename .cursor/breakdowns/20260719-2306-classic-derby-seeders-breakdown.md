# Classic & Derby Demo Seeders

**Date:** 2026-07-19 23:06

## Summary

Added two idempotent Node seed commands that create matching-ready demo events with owners, roosters (verified + weighed), mixed cashier dues, and automatic activation as the sole staff `is_active` event. Intended for local practice of Cashier and Matching flows.

## Changelog

- `npm run seed:classic-demo` creates `[SEED] Classic Cashier Matching` — 16 owners × 1 cock, fees enabled for practice, mixed unpaid/partial/paid.
- `npm run seed:derby-demo` creates `[SEED] Derby Cashier Matching` — 10 owners × 3 cocks, registration + rooster + cash bond fees, prize structure, mixed dues.
- Both leave roosters matching-ready (`verified` lineup, `passed` weighing, approved registration).
- Both clear any current active event, then set the seeded event as the sole active event (unlike UI activate, which refuses when a peer is active).
- Re-running a command deletes the prior event of that seed name and recreates it.

## Changelog (2026-07-19 23:21) — revolving fund opening

- Classic seed sets `revolving_fund_initial` to **50000** and posts matching `event_revolving_fund_ledger` opening row.
- Derby seed sets `revolving_fund_initial` to **200000** and posts opening ledger row.
- Shared `insertDemoEvent` always creates the opening ledger entry (same as `createEvent`).

## Changelog (2026-07-19 23:31) — seeded payment collections

- Each seeded payment now posts a matching `collection` row on `event_revolving_fund_ledger` (same as `recordPayment`).
- Running `balance_after` chains from opening balance through all seeded collections.
- Classic demo: opening 50000 + 5200 collected = balance 55200 (12 collection rows).
- Derby demo: opening 200000 + 15500 collected = balance 215500 (11 collection rows).
- `source_payment_id` is set when the cashier-posts migration is applied; otherwise collection rows omit it.

## Changelog (2026-07-19 23:35) — auto-bootstrap admin

- Demo seeders auto-create the first admin when `needs_bootstrap` is true and `ruelluna@gmail.com` is missing (password `password`, overridable via `SEED_FIRST_ADMIN_*` env vars).
- `npm run seed:first-admin` is optional before classic/derby demo seeds on a fresh DB.

## Changelog (2026-07-20 00:10) — --linked flag

- `npm run seed:classic-demo:linked` / `seed:derby-demo:linked` (or `node scripts/... --linked`) targets the Supabase project from `supabase link`, not `.env.local` local URLs.
- Resolves remote URL + service role via `supabase projects api-keys` (Windows: `supabase.cmd`).
- Fallback: set `SUPABASE_SERVICE_ROLE_KEY` in `.env.linked` if CLI key fetch fails.

## Files touched

- `scripts/lib/seed-demo-shared.mjs` — env, service client, actor, teardown, activate, inserts
- `scripts/seed-classic-demo.mjs`
- `scripts/seed-derby-demo.mjs`
- `package.json` — `seed:classic-demo`, `seed:derby-demo`

## Stage files

```bash
git add \
  scripts/lib/seed-demo-shared.mjs \
  scripts/seed-classic-demo.mjs \
  scripts/seed-derby-demo.mjs \
  package.json \
  .env.example \
  supabase/seed.sql \
  .cursor/breakdowns/20260719-2306-classic-derby-seeders-breakdown.md
```




## Deploy steps

## Deploy steps

None. Local/dev only. Requires `.env.local` with `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`. Prefer a non-production database.

Prerequisite: Supabase env vars only. On a fresh DB (`needs_bootstrap`), demo seeds create `ruelluna@gmail.com` / `password` automatically; otherwise use an existing seed admin or run `npm run seed:first-admin`.

## Manual test steps

1. Optionally set some other event as active in the UI.
2. Run `npm run seed:classic-demo` — console should report any displaced active event and that the classic seed is now active.
3. Open `/dashboard/events/{id}/payments` — unpaid owners show dues; record a cash payment.
4. Open `/dashboard/events/{id}/matching` — eligible roosters appear; pair Meron/Wala.
5. Run `npm run seed:derby-demo` — displaces classic as active; 30 roosters and higher dues (incl. cash bond).
6. Re-run either command — prior seed of that name is replaced; active flag re-asserted.

## E2E

N/A — engineer CLI seeds, not a user-facing UI flow.

## Vitest

N/A — Node scripts with direct service-role inserts.

## Documentation

- Admin docs: N/A (dev CLI; no operator-facing product change; no shell commands in published guides)
- User docs: N/A

## Suggested ClashPoint commit

```
Summary: Seed opening revolving fund on classic and derby demos

body: Cashier practice needs a starting ledger balance; seeds now set revolving_fund_initial and post the opening event_revolving_fund_ledger row like createEvent.
```

## Commit commands

```bash
git commit -m "$(cat <<'EOF'
Add --linked flag for demo seeds on linked Supabase

Demo seed scripts can target supabase link remote project via --linked or npm seed:*:linked scripts, fetching remote service role keys instead of local .env.local credentials.
EOF
)"
```




## Linear paste block

## Linear paste block

```
Title: Add classic and derby demo seed commands

Description:
Two npm seed scripts create classic (16×1) and derby 3-cock (10×3) demo events with mixed unpaid/partial/paid dues and verified/weighed roosters for Cashier and Matching practice. Each run replaces the prior seed of that name and activates the new event as the sole is_active event.

Comment / instructions:
Local only. Run npm run seed:first-admin once if needed, then npm run seed:classic-demo or npm run seed:derby-demo against a non-prod DB. No migrations or env vars beyond existing Supabase service role.

Documentation:
N/A
```
