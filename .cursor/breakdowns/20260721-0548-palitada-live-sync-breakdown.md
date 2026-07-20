# Palitada live sync fix

**Date:** 2026-07-21

## Summary

Palitada add/remove on Bet Balancing pit now syncs to the Matching board Active Match tab in a second browser window via a simplified cross-tab layer.

## Manual test

Two windows on http://localhost:3000 — pit add/remove updates Active Match within ~1s.

## Tests

npm run test:run -- features/matches/matching-cross-tab-sync.test.ts
npm run build
