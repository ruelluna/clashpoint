import { describe, expect, it } from 'vitest'

import { buildPledgeSettlementInput } from '@/features/matches/pledge-settlement'
import type { MatchListItem } from '@/features/matches/types'

const baseMatch: MatchListItem = {
  id: 'match-1',
  event_id: 'event-1',
  fight_number: 1,
  round_number: 1,
  status: 'fighting',
  queue_status: 'fighting',
  in_meron_odds: null,
  in_wala_odds: null,
  meron: {
    entry_id: 'e1',
    entry_number: '1',
    entry_name: 'Meron',
    owner_name: 'Owner A',
    rooster_id: 'r1',
    cock_number: 1,
    band_number: 'M1',
    weight: 2,
    bet_amount: 30000,
    bet_collected_amount: 30000,
    bet_barcode: 'BET-1-M',
    bet_payment_status: 'paid',
  },
  wala: {
    entry_id: 'e2',
    entry_number: '2',
    entry_name: 'Wala',
    owner_name: 'Owner B',
    rooster_id: 'r2',
    cock_number: 2,
    band_number: 'W1',
    weight: 2,
    bet_amount: 20000,
    bet_collected_amount: 20000,
    bet_barcode: 'BET-1-W',
    bet_payment_status: 'paid',
  },
  meron_palitada: [],
  wala_palitada: [],
}

describe('buildPledgeSettlementInput', () => {
  it('maps match pledges and palitada contributors into settlement input', () => {
    const input = buildPledgeSettlementInput({
      match: {
        ...baseMatch,
        wala_palitada: [
          {
            id: 'p1',
            contributor_name: 'Monton',
            contributor_type: 'monton',
            amount: 10000,
          },
        ],
      },
      commissionRatePercent: 10,
      taxAmount: 100,
    })

    expect(input.meronBasePledge).toBe(30000)
    expect(input.walaBasePledge).toBe(20000)
    expect(input.walaPalitadaContributors).toHaveLength(1)
    expect(input.commissionRatePercent).toBe(10)
    expect(input.taxAmount).toBe(100)
  })
})
