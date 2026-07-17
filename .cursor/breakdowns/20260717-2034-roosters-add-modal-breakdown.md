# Roosters tab add form modal

**Date:** 2026-07-17

## Summary

Replaced the Roosters tab collapsible inline add form with a Chakra Dialog modal. Same fields, validation, and `createRoosterAction` server action — presentation only.

## Changelog

- **Add rooster** opens a modal instead of expanding inline below the header.
- Cancel closes the modal and resets the form for the next open.
- `?entryId=` and barcode deep links still auto-open the modal with owner pre-selected.
- Derby save still redirects to the rooster print slip; classic save closes the modal after success.

## Files touched

- `features/event-roosters/components/event-roosters-client.tsx`
- `e2e/event-roosters-owner-scan.spec.ts`
- `e2e/rooster-entries-weighing-matching.spec.ts`

## Deploy steps

None — frontend only.

## Manual test steps

1. **Events → Roosters** — click **Add rooster** → modal opens; **Cancel** closes without saving.
2. Derby with `?entryId=` or barcode URL — modal opens with owner selected.
3. Save derby rooster → redirects to print slip.
4. Save classic rooster → modal closes; new card in list.
5. Validation error → modal stays open with error message.

## Tests

| Layer | Status |
|-------|--------|
| Vitest | N/A — UI shell only |
| E2E | Updated dialog visibility assertions in roosters specs |
| Build | `npm run build` — passed |

```bash
npx playwright test e2e/event-roosters-owner-scan.spec.ts
npx playwright test e2e/rooster-entries-weighing-matching.spec.ts
```

## Suggested commit

```
Summary: Open Roosters add form in modal

Replace collapsible inline form with Chakra Dialog for a cleaner list-first
layout. Preserves barcode/entryId auto-open and derby print redirect.
```

## Linear paste block

```
Title: Open Roosters add form in modal

Description:
- Add rooster opens a dialog instead of inline collapsible form
- Cancel resets form; entryId/barcode URLs still auto-open modal
- Derby save still redirects to print slip

Comment / instructions:
No migration or env changes. Optional: npx playwright test e2e/event-roosters-owner-scan.spec.ts

Documentation:
N/A — same workflow, different presentation
```
