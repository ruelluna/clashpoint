# Rooster breed, color, and notes (required on add)

**Date:** 2026-07-15

## Summary

Breed, color (Black / Red / Other + custom text), and notes are now **required** when adding event roosters on staff Roosters tab (Classic and Derby), public derby registration, and rooster create slots.

## Changelog

- Staff Add rooster form collects breed, color preset, and notes (Classic + Derby)
- Public derby registration requires breed, color, and notes per filled cock slot
- Color uses preset select (Black, Red, Other) with text when Other
- Owner check panel and roosters list show breed and color

## Deploy

Apply `supabase/migrations/202607151830_rooster_breed_presets.sql`

## Tests

```bash
npm run test:run -- features/entries/rooster-color.test.ts features/entries/schema.test.ts features/weighing/schema.test.ts
npx playwright test e2e/public-registration.spec.ts e2e/event-roosters-owner-scan.spec.ts
```

## Docs

N/A — nested doc repos not in workspace
