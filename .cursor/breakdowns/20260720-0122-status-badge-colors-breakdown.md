# Status badge colors (app-wide)

**Date:** 2026-07-20

## Summary

Added shared status-to-color helpers and wired `colorPalette` on Chakra badges across registration, event, match, promoter, policy, user, and revolving-fund UIs. Status values (e.g. Approved, Open, Paid) now use consistent semantic colors instead of default gray.

## Changelog

- Owner detail **Registration status** and rooster/eligibility badges show green/orange/red/purple by status
- Event status badges on dashboard, edit form, public pages, and promoter portal use status-based colors
- Match and fight-queue badges use shared match/queue color mapping
- Promoter report and list statuses use green/orange/gray
- Eligibility policy, user roles, and revolving fund entry types are color-coded
- Centralized helpers in `lib/derby/status-colors.ts` and feature `display-utils.ts` files

## Files touched

### lib/
- `lib/derby/status-colors.ts` (new)
- `lib/derby/status-colors.test.ts` (new)

### features/
- `features/entries/display-utils.ts` (new)
- `features/entries/display-utils.test.ts` (new)
- `features/entries/components/owner-detail-client.tsx`
- `features/events/display-utils.ts` (new)
- `features/events/components/event-status-badges.tsx`
- `features/events/components/event-form-client.tsx`
- `features/registrations/components/registration-detail-client.tsx`
- `features/registrations/components/registration-review-client.tsx`
- `features/event-roosters/components/event-roosters-client.tsx`
- `features/roosters/components/rooster-profile-client.tsx`
- `features/matches/display-utils.ts` (new)
- `features/matches/components/matching-board-client.tsx`
- `features/matches/components/fight-queue-client.tsx`
- `features/promoters/display-utils.ts` (new)
- `features/promoters/components/promoters-list-client.tsx`
- `features/promoters/components/promoter-form-client.tsx`
- `features/promoter-portal/components/portal-events-list.tsx`
- `features/reports/components/promoter-report-client.tsx`
- `features/eligibility/components/eligibility-policy-summary-panel.tsx`
- `features/users/display-utils.ts` (new)
- `features/users/components/users-page-client.tsx`
- `features/revolving-fund/display-utils.ts` (new)
- `features/revolving-fund/components/revolving-fund-client.tsx`
- `features/public/components/public-matches-list.tsx`

### app/
- `app/dashboard/events/[id]/page.tsx`
- `app/events/[id]/page.tsx`
- `app/events/[id]/register/page.tsx`

## Stage files

```bash
git add \
  lib/derby/status-colors.ts \
  lib/derby/status-colors.test.ts \
  features/entries/display-utils.ts \
  features/entries/display-utils.test.ts \
  features/entries/components/owner-detail-client.tsx \
  features/events/display-utils.ts \
  features/events/components/event-status-badges.tsx \
  features/events/components/event-form-client.tsx \
  features/registrations/components/registration-detail-client.tsx \
  features/registrations/components/registration-review-client.tsx \
  features/event-roosters/components/event-roosters-client.tsx \
  features/roosters/components/rooster-profile-client.tsx \
  features/matches/display-utils.ts \
  features/matches/components/matching-board-client.tsx \
  features/matches/components/fight-queue-client.tsx \
  features/promoters/display-utils.ts \
  features/promoters/components/promoters-list-client.tsx \
  features/promoters/components/promoter-form-client.tsx \
  features/promoter-portal/components/portal-events-list.tsx \
  features/reports/components/promoter-report-client.tsx \
  features/eligibility/components/eligibility-policy-summary-panel.tsx \
  features/users/display-utils.ts \
  features/users/components/users-page-client.tsx \
  features/revolving-fund/display-utils.ts \
  features/revolving-fund/components/revolving-fund-client.tsx \
  features/public/components/public-matches-list.tsx \
  app/dashboard/events/[id]/page.tsx \
  app/events/[id]/page.tsx \
  app/events/[id]/register/page.tsx \
  .cursor/breakdowns/20260720-0122-status-badge-colors-breakdown.md
```

## Commit commands

```bash
git commit -m "$(cat <<'EOF'
Add status-based badge colors across dashboard

Centralize status color helpers and wire colorPalette on registration,
event, match, promoter, and policy badges so operators can scan status
at a glance instead of seeing neutral gray for every value.
EOF
)"
```

## Deploy steps

None — UI-only change.

## Manual test steps

1. **Event → Owners → View Owner** — Registration status **Approved** should be green; rooster rows show colored workflow/eligibility badges.
2. **Event detail** (`/dashboard/events/[id]`) — Event status badge matches status (e.g. open=green, in progress=blue).
3. **Matching / Fight queue** — Match and queue badges are colored.
4. **Reports → Promoters** — Status column uses green/orange/gray.

## E2E

N/A — color-only UI; no behavior change.

## Suggested ClashPoint commit

**Summary:** Add status-based badge colors across dashboard

**Body:** Centralize status color helpers and wire colorPalette on registration, event, match, promoter, and policy badges so operators can scan status at a glance instead of seeing neutral gray for every value.

## Linear paste block

```
Title: Add status-based badge colors across dashboard

Description:
Status badges on Owner detail, event pages, matches, promoters, and related screens now use colorPalette with shared helpers. Approved/open/paid-style statuses read as green; rejected/cancelled as red; pending as orange.

Comment / instructions:
No migration or env changes. Spot-check Event → Owners → View Owner and event detail status badges after deploy.

Documentation:
N/A
```
