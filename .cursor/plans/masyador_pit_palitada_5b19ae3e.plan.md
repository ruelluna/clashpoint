---
name: Masyador Pit Palitada
overview: Review the Bet Balancing / Palitada work discussed so far, then ship a dedicated tablet-friendly Masyador pit route where staff record VIP and Monton Palitada to cover the Difference before handlers are called—reusing the existing pledge settlement engine and fixing the current UI timing gap.
todos:
  - id: extract-palitada-form
    content: Extract shared MatchPalitadaRecordForm + contribution list from match-palitada-balancing-dialog.tsx for reuse in pit and dialog
    status: pending
  - id: pit-route
    content: Add /dashboard/events/[id]/matching/pit page with waiting-fight selection and matches.manage gate
    status: pending
  - id: pit-tablet-ui
    content: "Build matching-pit-client: Difference panel, inline VIP/Monton record, Cover remainder, settlement preview with VIP win/loss/draw lines"
    status: pending
  - id: nav-revalidate
    content: Add Masyador pit nav link from Matching board; revalidate pit path in Palitada server actions
    status: pending
  - id: tests-docs
    content: Vitest for pit fight resolver; E2E scaffold; admin + user Palitada docs; breakdown file
    status: pending
isProject: false
---

# Masyador Pit — Bet Balancing / Palitada Review & Plan

## What we discussed (original intent)

From your pit-side workflow description:

1. When handler pledges are unequal, there is a **Difference** between Meron and Wala totals.
2. **Masyador at the pit** uses a **tablet** to walk the crowd and record **VIP Palitada** from people who accept the difference.
3. If VIPs do not cover the full gap, **Monton** can pledge from the **revolving fund** so the fight is not cancelled.
4. After Palitada is recorded, **inside odds and payouts must be correct** — including proportional split when the winning side has handler + VIP + Monton money.
5. VIP cash collection at Cashier is **later**; for now record name + amount + type, but **win/loss/draw outcomes** must still calculate what each VIP owes or receives.

```mermaid
flowchart TD
  pledges[Handler pledges collected at Cashier] --> diff[Difference on underdog side]
  diff --> vip[VIP Palitada recorded by Masyador]
  vip --> gap{Still short?}
  gap -->|Yes| monton[Monton revolving fund Palitada]
  gap -->|No| balanced[Sides balanced]
  monton --> balanced
  balanced --> call[Call handlers]
  call --> result[Fight result]
  result --> settle[Settlement: handler + VIP + Monton payouts]
```

---

## What is already built (keep as foundation)

| Layer | Status | Key files |
|-------|--------|-----------|
| **Settlement math (legacy parity)** | Done | [`features/matches/pledge-settlement.ts`](features/matches/pledge-settlement.ts) |
| Per-side commission, 50/50 tax split, natural imbalanced odds | Done | Same |
| Proportional handler / VIP / Monton winnings | Done | `buildSideBreakdown`, `sideWinTotal` |
| Accounting identity: Monton + side win = gross pool | Done (UI fixed) | [`match-bet-balancing-panel.tsx`](features/matches/components/match-bet-balancing-panel.tsx) |
| Palitada DB + RLS | Done | [`supabase/migrations/202607210200_match_pledge_settlement.sql`](supabase/migrations/202607210200_match_pledge_settlement.sql) |
| Add/delete Palitada service + actions | Done | [`palitada-service.ts`](features/matches/palitada-service.ts), [`actions.ts`](features/matches/actions.ts) |
| Rules: underdog only, cap at Difference, lock after handlers called | Done | `validatePalitadaContribution`, `isBetEditHardLocked` |
| Persist inside odds on result | Done | [`pledge-settlement-service.ts`](features/matches/pledge-settlement-service.ts) |
| Draw Monton refunds to revolving fund | Done | `settlePalitadaDrawRefunds` |
| Vitest (14 tests) | Done | [`pledge-settlement.test.ts`](features/matches/pledge-settlement.test.ts) |
| Read-only settlement panel on Active Match | Done | `MatchBetBalancingPanel` |
| Dialog-based record UI | Done but misplaced | [`match-palitada-balancing-dialog.tsx`](features/matches/components/match-palitada-balancing-dialog.tsx) |

**Reference example (Fight #2 — no Palitada):** Meron ₱12,000 / Wala ₱10,000 · 10% · ₱100 tax → Difference ₱2,000 · Monton ₱2,300 + side win ₱19,700 = gross pool ₱22,000.

**Split example (your VIP case):** Meron ₱12k / Wala handler ₱3k + VIP Palitada ₱9k → balanced ₱12k each side → if Wala wins, handler gets 25% of winning pool, VIPs get 75%.

---

## Critical gap: Palitada UI is unreachable in normal flow

This is the main reason the Masyador workflow does not work yet:

| Rule | Code |
|------|------|
| Palitada editable only while `queue_status === 'waiting'` | [`isBetEditHardLocked`](features/matches/utils.ts) blocks `handlers_called`+ |
| **Bet Balancing button** only on **Active Match** | [`matching-active-match-panel.tsx`](features/matches/components/matching-active-match-panel.tsx) |
| Active Match shows fights **`handlers_called` → `fighting`** only | `ACTIVE_CALLED_QUEUE_STATUSES` in [`utils.ts`](features/matches/utils.ts) |
| **Fight Queue** (`waiting`) has no Palitada entry | [`matching-fight-queue-panel.tsx`](features/matches/components/matching-fight-queue-panel.tsx) / `FightQueueRow` |

Result: by the time staff see Bet Balancing, Palitada is **hard-locked**. The dedicated pit route fixes this by targeting **`waiting`** fights before **Call handlers**.

---

## Remaining gaps (out of scope for pit UI pass unless noted)

| Gap | Notes |
|-----|-------|
| **No `masyador` role** | Use existing **`matching`** module → `matches.manage` (same as matchmaker staff) |
| **Monton RF ledger on record** | Adding Monton Palitada does not debit revolving fund yet; only **draw refunds** post on result |
| **Monton win credit to RF** | Winning Monton Palitada share is calculated in snapshot but not posted to revolving fund on win |
| **VIP cash at Cashier** | Deferred per your choice; record-only now |
| **Published docs** | No admin/user Palitada guides in nested doc repos yet |
| **E2E** | [`e2e/match-pledge-settlement.spec.ts`](e2e/match-pledge-settlement.spec.ts) skipped |
| **Terminology polish** | Stat card renamed to **Difference**; badges still say **Imbalanced** |

---

## Proposed solution: Dedicated Masyador pit route

**Route:** `/dashboard/events/[id]/matching/pit`
**Permission:** `matches.manage` + `canOperateAsStaff` (same gate as Matching manage actions)
**Layout:** Tablet-first, minimal chrome — large touch targets (`size="md"`), single-fight focus, optional slim header (event name, fight #, back link to Matching).

### Fight selection

- Default: **lowest fight number** in `queue_status === 'waiting'` with pledges settled (`matchPledgesSettled`).
- If multiple waiting fights: simple fight picker (tabs or select).
- If none waiting: empty state → “No fight ready for Palitada” + link to Fight Queue.

### Pit screen sections (top to bottom)

1. **Header** — Fight #N · Meron vs Wala · badge **Balanced** / **Needs Palitada**
2. **Difference panel** — Meron total, Wala total, **Difference** amount, underdog side, **remaining capacity** (`amountNeededToBalance − recorded Palitada on underdog`)
3. **Record Palitada** (inline form, not modal)
   - Contributor name
   - Type: **VIP** | **Monton revolving fund**
   - Amount (default/max hint = remaining capacity)
   - Side locked to **underdog** (read-only)
   - Primary action: **Add Palitada**
   - Secondary: **Cover remainder with Monton** (one tap fills remaining gap as Monton type, name e.g. “Monton revolving fund”)
4. **Recorded contributions** — list with **Remove** (same server actions as today)
5. **Settlement preview** — reuse slimmed [`MatchBetBalancingPanel`](features/matches/components/match-bet-balancing-panel.tsx) sections:
   - Total winning pool + inside odds
   - Winnings Potential per side (side win total, handler payout, VIP/Monton payout lines)
   - Per-contributor **projected outcome** row: *If underdog wins: +₱X · If underdog loses: −₱stake · Draw refund: ₱Y* (VIP/Monton from existing `winnings` / `drawNetRefund` fields)
6. **Ready banner** — when `isBalanced`, show green “Sides balanced — ready to call handlers” (no queue advance on pit screen; staff return to Fight Queue)

### Component structure

```
app/dashboard/events/[id]/matching/pit/page.tsx          (server: load event + waiting matches)
features/matches/components/matching-pit-client.tsx      (tablet shell)
features/matches/components/matching-pit-fight-panel.tsx (single fight UI)
features/matches/components/match-palitada-record-form.tsx (extract from dialog)
```

Refactor [`match-palitada-balancing-dialog.tsx`](features/matches/components/match-palitada-balancing-dialog.tsx) to compose the shared record form + list so logic is not duplicated.

### Navigation entry

- Link from Matching board header: **“Masyador pit”** (visible when `canManage`)
- Optional shortcut from Fight Queue row when `waiting` && imbalanced

### Backend changes

- **None required for MVP** — reuse `addPalitadaContributionAction` / `deletePalitadaContributionAction`
- Revalidate `/dashboard/events/[id]/matching/pit` in those actions alongside existing matching paths

---

## VIP owe / payout (this pass vs later)

**This pass (pit UI only):**
- Show **projected** VIP/Monton lines from `calculatePledgeSettlement` on the pit screen:
  - **Win (their side):** `contributor.winnings`
  - **Loss (their side):** −`contributor.amount`
  - **Draw:** `contributor.drawNetRefund` (Monton only posts to RF today)

**Later (Cashier phase — not this pass):**
- Collect VIP Palitada cash when recorded
- Settle VIP payouts after result from snapshot
- Monton RF debit on record + credit on win

---

## Tests & docs

| Item | Action |
|------|--------|
| Vitest | Add pit helper test: resolve next waiting fight; no new math tests needed |
| E2E | New `e2e/matching-pit-palitada.spec.ts` — open pit route, add VIP, verify Difference drops, balanced state (unskip when matchmaker fixture exists) |
| Admin doc | `docs/admins/docs/match-palitada-admin.md` — Masyador pit flow, VIP vs Monton, before Call handlers |
| User doc | `docs/users/docs/match-palitada-matching.md` — staff-facing pit steps (no CLI) |
| Breakdown | `.cursor/breakdowns/YYYYMMDD-HHMM-masyador-pit-palitada-breakdown.md` |

---

## Suggested implementation order

1. Extract shared Palitada record form + contribution list from dialog
2. Add pit route + client + fight selection for `waiting` matches
3. Build tablet UI (Difference, record, list, settlement preview, VIP outcome lines)
4. Wire navigation links + action revalidation
5. Vitest + E2E scaffold + admin/user docs
6. (Follow-up) Monton RF ledger on record/win; Cashier VIP collection

---

## Out of scope for this plan

- New `masyador` RBAC role or Palitada-only permission
- Native app / offline / Realtime
- Moving **Call handlers** onto the pit screen (keep on Fight Queue for now)
- Full revolving-fund automation for Monton Palitada lifecycle
