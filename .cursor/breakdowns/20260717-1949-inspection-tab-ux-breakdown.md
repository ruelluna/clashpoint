# Inspection tab view/edit flow — breakdown

**Date:** 2026-07-17

## Summary

Refactored Events → Inspection into a two-mode operator flow: minimal cock summary with **Inspect** / **Edit inspection**, grams-based weight (max 10,000 g) with single-step record+verify and auto pass/fail, gated physical inspection fields, **Approve** / **Reject** only in edit mode, and a rejection-reason overlay dialog. Weight failure auto-marks inspection as failed and returns to view mode. Fixed post-approve form reset by closing edit mode and syncing fields from server props on reopen.

## Changelog

- Inspection rows default to view mode — summary left, **Inspect** or **Edit inspection** right
- Weight input uses grams (max 10,000 g), matching rooster registration
- Single **Record weight** step records and verifies official weight
- Out-of-range weight auto-fails inspection and closes edit mode
- Physical inspection + notes appear only after weight passes
- **Approve** / **Reject** visible only in edit mode; rejection reason uses overlay with Confirm / Cancel
- Declared and official weights display in grams in the inspection queue

## Files touched

### app/
- `app/dashboard/events/[id]/inspection/page.tsx` — pass event weight limits to client

### features/
- `features/weighing/schema.ts` — `inspectionWeightGramsSchema`, `recordInspectionWeightSchema`
- `features/weighing/service.ts` — `recordAndVerifyWeightFromGrams`
- `features/weighing/actions.ts` — `recordAndVerifyWeightAction`
- `features/inspection/queries.ts` — `declaredWeightGrams`, `officialWeightGrams`
- `features/inspection/actions.ts` — `submitInspectionWeightAction` with auto-fail; `inspectionClosed` flag
- `features/inspection/components/inspection-station-client.tsx` — view/edit flow refactor
- `features/inspection/components/inspection-reject-dialog.tsx` — new rejection overlay

### tests
- `features/weighing/schema.test.ts`
- `features/weighing/service.test.ts`
- `e2e/rooster-entries-weighing-matching.spec.ts`

## Deploy steps

No new migrations. Deploy app only. No new env vars.

## Manual test steps

1. Open **Events → Inspection** for an event with physical inspection required.
2. Find a rooster — row shows summary + **Inspect** only (no weight form or Approve/Reject).
3. Click **Inspect** → enter weight in grams (e.g. `2100`) → **Record weight** → see **Weight passed** and physical inspection fields.
4. Set physical inspection to Passed, add notes → **Approve** → view mode shows **Edit inspection** and preserved notes.
5. Reopen **Edit inspection** — notes and status are pre-filled (no reset).
6. Repeat with out-of-range weight → auto **Failed**, returns to view mode.
7. On passed weight, click **Reject** → overlay → enter reason → **Confirm** → failed in view mode.

## E2E

Updated: `e2e/rooster-entries-weighing-matching.spec.ts`

```bash
npx playwright test e2e/rooster-entries-weighing-matching.spec.ts
```

## Unit tests

```bash
npm run test:run -- features/weighing/schema.test.ts features/weighing/service.test.ts
npm run build
```

## Suggested ClashPoint commit

**Summary:** Refactor Inspection tab into view/edit flow with grams weight

**Body:** Operators see minimal cock summary with Inspect/Edit inspection, record weight in grams with single-step verify and auto-fail, gated physical inspection, and rejection overlay. Fixes form reset after approve.

## Documentation

**Admin:** N/A — nested `docs/admins/` repo not cloned in this workspace. When publishing, extend `phase-05-lineup-weighing/` inspection guide with view/edit flow, grams input, and rejection overlay (in-app steps only).

**User:** N/A — organizer-only workflow.

## Linear paste block

```
Title: Refactor Inspection tab into view/edit flow with grams weight

Description:
Inspection rows now open in view mode with Inspect/Edit inspection. Weight is entered in grams (max 10,000 g), recorded and verified in one step, and out-of-range weights auto-fail. Physical inspection and Approve/Reject appear only in edit mode; rejection uses an overlay dialog.

Comment / instructions:
Deploy app only — no migration. Test: Events → Inspection → Inspect → record weight in grams → Approve → confirm Edit inspection preserves notes.

Documentation:
Admin: update phase-05-lineup-weighing inspection guide when doc repo is available
```
