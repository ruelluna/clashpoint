# Event status simplification (Option 3)

**Date:** 2026-07-19

## Summary

Collapsed the nine-step event lifecycle into six statuses. Prep phases (`registration_closed`, `ready_for_weighing`, `ready_for_matching`, `ongoing`) are replaced by a single **In Progress** phase that covers check-in through fights. Existing rows are migrated automatically.

## Changelog

- Event statuses are now: **Draft → Open → In Progress → Completed → Archived** (plus Cancelled)
- Classic and Derby events share the same simplified lifecycle
- **Mark In Progress** replaces the old Registration Closed / Ready for Weighing / Ready for Matching / Ongoing buttons
- Matching board opens when the event is **In Progress**
- Public registration still requires **Open** status only
- Inspection "queue complete" panel offers **Mark In Progress** when the event is still Open
- **Active** badge remains separate (staff ops focus, not lifecycle)

## Files touched

### supabase/
- `migrations/202607192345_event_status_simplify.sql`

### features/
- `events/types.ts`, `schema.ts`, `utils.ts`, `utils.test.ts`, `service.ts`, `service.test.ts`
- `events/components/event-status-badges.tsx`
- `public/components/public-events-list.tsx`
- `inspection/components/inspection-station-client.tsx`
- `matches/service.ts`, `matches/queries.ts`

### lib/
- `supabase/database.types.ts`

### scripts/
- `lib/seed-demo-shared.mjs`

## Stage files

```bash
git add \
  supabase/migrations/202607192345_event_status_simplify.sql \
  features/events/types.ts \
  features/events/schema.ts \
  features/events/utils.ts \
  features/events/utils.test.ts \
  features/events/service.ts \
  features/events/service.test.ts \
  features/events/components/event-status-badges.tsx \
  features/public/components/public-events-list.tsx \
  features/inspection/components/inspection-station-client.tsx \
  features/matches/service.ts \
  features/matches/queries.ts \
  lib/supabase/database.types.ts \
  scripts/lib/seed-demo-shared.mjs \
  .cursor/breakdowns/20260719-2345-event-status-simplify-breakdown.md
```

## Deploy steps

1. Apply migration: `supabase db push` or run `202607192345_event_status_simplify.sql` in the Supabase dashboard
2. No new env vars
3. Re-seed demo data only if you rely on old enum values in local scripts (seed script already updated)

## Manual test steps

1. Open an event in **Draft** → **Mark Open** → confirm public registration works
2. **Mark In Progress** → confirm public registration closes; matching board allows new pairs
3. Complete inspection queue on an **Open** event → **Mark In Progress** shortcut appears
4. **Mark Completed** → confirm **Active** clears if set
5. Classic event overview shows **In Progress** (not "Ready for Matching")

## Tests

- Vitest: `npm run test:run -- features/events/utils.test.ts features/events/service.test.ts` (16 passed)
- Build: `npm run build` (passed)
- E2E: N/A — existing specs only use **Mark Open**; no status-label assertions to update

## Suggested ClashPoint commit

```
Simplify event lifecycle to six statuses

Replace registration_closed, ready_for_weighing, ready_for_matching,
and ongoing with a single in_progress phase. Migration maps existing
rows; matching and day-of ops gate on in_progress.
```

## Commit commands

```bash
git commit -m "$(cat <<'EOF'
Simplify event lifecycle to six statuses

Replace registration_closed, ready_for_weighing, ready_for_matching,
and ongoing with a single in_progress phase. Migration maps existing
rows; matching and day-of ops gate on in_progress.
EOF
)"
```

## Documentation

- Admin doc: N/A — `docs/admins/` not present in workspace
- User doc: N/A — no player-facing status workflow doc exists

## Linear paste block

```
Title: Simplify event lifecycle to six statuses

Description:
Event status is now Draft → Open → In Progress → Completed → Archived.
Removed Registration Closed, Ready for Weighing, Ready for Matching, and
Ongoing. Classic and Derby share the same flow. Matching requires In Progress.

Comment / instructions:
Apply migration 202607192345_event_status_simplify.sql after deploy.
Test: Mark Open → register → Mark In Progress → create match → Mark Completed.
```
