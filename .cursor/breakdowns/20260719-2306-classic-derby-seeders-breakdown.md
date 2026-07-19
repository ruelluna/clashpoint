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
  .cursor/breakdowns/20260719-2306-classic-derby-seeders-breakdown.md \
  .cursor/rules/plan-implementation.mdc
```

## Deploy steps

## Deploy steps

None. Local/dev only. Requires `.env.local` with `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`. Prefer a non-production database.

Prerequisite: `npm run seed:first-admin` (or an existing profile for `SEED_FIRST_ADMIN_EMAIL`, default `ruelluna@gmail.com`).

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
Summary: Add classic and derby demo seed commands for cashier and matching practice

body: Idempotent Node seeds create matching-ready events with owners, roosters, and mixed dues, then take over the sole active event so local ops practice does not fight the UI activate guard.
```

## Commit commands

```bash
git commit -m "$(cat <<'EOF'
Add classic and derby demo seed commands for cashier and matching practice

Idempotent Node seeds create matching-ready events with owners, roosters, and mixed dues, then take over the sole active event so local ops practice does not fight the UI activate guard.
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
