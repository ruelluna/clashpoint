# Promoter status change UX consolidation

**Date:** 2026-07-19

## Summary

Consolidated promoter status changes into the main edit form with an optional reason field when status differs from saved value. Removed the redundant Quick status change panel. Status history (with reasons) now appears on the promoter detail page from `audit_logs`. The global audit trail page shows status transitions and reasons when present.

## Changelog

- Promoter status is changed only via **Save changes** on the main edit form
- When status differs from the saved value, an optional **Reason for status change** field appears (stored in audit trail)
- Removed the separate **Quick status change** panel and dead `changePromoterStatus` action/service path
- Promoter detail page shows **Status history** (date, transition, reason)
- Audit trail entries show `Status: old → new` and `Reason: …` when available in log values

## Files touched

### app/
- `app/dashboard/promoters/[id]/page.tsx` — fetch status history
- `app/dashboard/audit/page.tsx` — show status/reason lines

### features/
- `features/promoters/schema.ts` — `statusChangeReason` on update schema; removed change-status schema
- `features/promoters/actions.ts` — parse reason; removed `changePromoterStatusAction`
- `features/promoters/service.ts` — dual audit logging rules for status vs profile changes
- `features/promoters/queries.ts` — `listPromoterStatusHistory`
- `features/promoters/status-history.ts` — audit row → history item mapping
- `features/promoters/types.ts` — `PromoterStatusHistoryItem`
- `features/promoters/components/promoter-form-client.tsx` — controlled status, conditional reason, history panel
- `features/promoters/schema.test.ts` — reason validation tests
- `features/promoters/service.test.ts` — audit logging tests
- `features/promoters/status-history.test.ts` — mapping tests

## Deploy steps

No migration or env vars. Deploy app only.

## Manual test steps

1. Open an **active** promoter → change status to **Suspended** → reason field appears → enter reason → **Save changes** → status saved
2. Reopen promoter → **Status history** shows transition + reason
3. Change status back without reason → history row shows reason as "—"
4. Change name only (status unchanged) → reason field hidden; no spurious status history row
5. `/dashboard/audit` → promoter entries show reason / status line when present

## E2E

N/A — form UX and audit display; manual verification sufficient.

## Tests

```bash
npm run test:run -- features/promoters/schema.test.ts features/promoters/service.test.ts features/promoters/status-history.test.ts
npm run build
```

Both passed on 2026-07-19.

## Suggested ClashPoint commit

**Summary:** Consolidate promoter status changes with optional audit reason

**Body:** Status changes now happen in the main promoter edit form with an optional reason stored in audit_logs. Removed the Quick status change panel, added status history on the promoter detail page, and surfaced reason/status lines on the audit trail.

## Suggested doc commits

N/A — internal organizer workflow tweak.

## Linear paste block

```
Title: Consolidate promoter status changes with optional audit reason

Description:
- Single edit form for promoter status with optional reason when status changes
- Removed Quick status change panel and dead change-status action
- Status history panel on promoter detail from audit_logs
- Audit trail shows status transition and reason when present

Comment / instructions:
No migration or env vars. Deploy app only. Test: edit promoter → change status with reason → verify Status history and /dashboard/audit entries.

Documentation:
N/A
```
