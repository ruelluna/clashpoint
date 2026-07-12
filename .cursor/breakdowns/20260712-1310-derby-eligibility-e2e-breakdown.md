# Derby eligibility save/edit E2E verification

**Date:** 2026-07-12

## Summary

Expanded `e2e/events.spec.ts` with save/edit coverage for entry fee, derby age profile, eligibility checkbox toggles on create, and standalone eligibility save on edit. E2E auth helper falls back to seeded event_organizer when static admin creds fail.

## E2E specs added/updated

- `saves entry fee and derby age profile on create`
- `toggles eligibility sub-checkboxes on create and persists on edit`
- `saves eligibility sub-checkboxes via standalone panel on edit`
- Updated labels: Derby format, Derby age profile

## Run E2E (dev server already on :3000)

```bash
$env:PLAYWRIGHT_BASE_URL="http://localhost:3000"
npx playwright test e2e/events.spec.ts
```

## Auth prerequisites (required for tests to pass)

**Option A:** Set valid credentials in `.env.local`:
- `PLAYWRIGHT_ADMIN_EMAIL` / `PLAYWRIGHT_ADMIN_PASSWORD` must match a dashboard user

**Option B:** Apply migration and use service-role seeding:
- `supabase db push` (includes `202607121708_service_role_e2e_grants.sql`)
- `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`

Runtime evidence: initial run failed with `Invalid email or password` (admin) and `permission denied for table profiles` (service role without grants).

## Manual test (if E2E blocked on auth)

1. New event → Derby → enable Weight/Banding/Payment → toggle sub-checkboxes
2. Set entry fee → Create event → Edit → verify checkboxes + fee persist
3. Edit → enable Inspection/Documents → Save eligibility settings → reload

## Vitest (already passing)

npm run test:run -- features/events/schema.test.ts features/eligibility/policy-form.test.ts
