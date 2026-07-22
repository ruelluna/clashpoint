# Active Match Sequential Numbering + Fight Queue Filter

**Date:** 2026-07-22

## Summary

Matching number suffixes are now an event-wide active-match sequence (+1 per pit entry), not fight_number. Codes assign on **Birds at pit** (`handlers_called → birds_at_pit`). The Fight Queue tab shows only **waiting** and **handlers_called** rows; pit/fighting matches appear on Active Match only.

## Changelog

- Matching numbers increment by one per active match (e.g. `ABCD-0003` then `WTST-0004`), independent of fight queue #.
- **Call handlers** no longer assigns a matching number.
- **Birds at pit** assigns the next sequential code for the event.
- Fight Queue tab hides matches at **Birds at pit** and **Fighting**.
- Active Match tab still shows handlers_called / pit / fighting; matching number appears after pit entry.

## Files touched

### features/

- `features/matches/schema.ts` — sequence helpers: `parseMatchingNumberSequence`, `nextMatchingNumberSequence`
- `features/matches/schema.test.ts`
- `features/matches/utils.ts` — `shouldAssignMatchingNumber`, `FIGHT_QUEUE_TAB_STATUSES`, filter helpers
- `features/matches/utils.test.ts`
- `features/matches/service.ts` — query existing numbers; assign on pit with next sequence
- `features/matches/components/matching-fight-queue-panel.tsx` — filter display list

### supabase/

- `supabase/migrations/202607220400_active_match_sequence.sql`

## Stage files

```bash
git add \
  features/matches/schema.ts \
  features/matches/schema.test.ts \
  features/matches/utils.ts \
  features/matches/utils.test.ts \
  features/matches/service.ts \
  features/matches/components/matching-fight-queue-panel.tsx \
  supabase/migrations/202607220400_active_match_sequence.sql \
  .cursor/breakdowns/20260722-0122-active-match-sequence-breakdown.md
```

## Deploy steps

Apply Supabase migration after deploy:

```bash
supabase db push
```

Or run `202607220400_active_match_sequence.sql` in the dashboard. Clears `matching_number` on waiting/handlers_called rows so codes re-assign at pit entry with correct sequence.

## Manual test steps

1. Open **Events → Matching** for an event with several queued fights.
2. **Call handlers** on fights #4–#6 — Fight Queue shows all three; Active Match shows the head match; no matching number yet.
3. Send fight #5 to **Birds at pit** — it leaves Fight Queue tab, appears on Active Match with code suffix = max existing + 1 (not fight #5).
4. Confirm another handlers_called fight stays in Fight Queue without a matching number until sent to pit.

## Tests

- Vitest: `npm run test:run -- features/matches/schema.test.ts features/matches/utils.test.ts` — 55 passed
- Build: `npm run build` — passed
- E2E: N/A — queue filter + server assignment logic; existing advance buttons unchanged

## Suggested ClashPoint commit

```
Use sequential active-match numbering at pit entry

Matching number suffix follows event-wide +1 sequence instead of
fight_number. Assign on birds at pit; Fight Queue tab hides pit and
fighting rows.
```

## Commit commands

```bash
git commit -m "$(cat <<'EOF'
Use sequential active-match numbering at pit entry

Matching number suffix follows event-wide +1 sequence instead of
fight_number. Assign on birds at pit; Fight Queue tab hides pit and
fighting rows.
EOF
)"
```

## Linear paste block

```
Title: Use sequential active-match numbering at pit entry

Description:
Matching numbers use event-wide +1 suffix (e.g. ABCD-0003 then WTST-0004), not fight #. Codes assign when staff send birds to pit. Fight Queue tab shows waiting and handlers_called only.

Comment / instructions:
Apply migration 202607220400_active_match_sequence.sql. Test: call handlers on multiple fights, send one to pit, confirm sequential code and that pit/fighting rows leave Fight Queue tab.

Documentation:
N/A
```
