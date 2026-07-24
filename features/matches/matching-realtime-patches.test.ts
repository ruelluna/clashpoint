import { describe, expect, it } from 'vitest'

import {
  patchMatchInList,
  removeMatchFromList,
  removePalitadaContributionFromMatch,
  removeSettlingMatch,
  sortSettlingMatches,
  upsertSettlingMatch,
} from '@/features/matches/matching-realtime-patches'
import type { MatchListItem, SettlingMatchListItem } from '@/features/matches/types'

function buildMatch(id: string, fightNumber: number): MatchListItem {
  return {
    id,
    event_id: 'event-1',
    fight_number: fightNumber,
    matching_number: null,
    round_number: 1,
    status: 'at_pit',
    queue_status: 'birds_at_pit',
    in_meron_odds: null,
    in_wala_odds: null,
    meron: {
      entry_id: 'e1',
      entry_number: '1',
      entry_name: 'Meron',
      owner_name: 'Owner M',
      rooster_id: 'r1',
      cock_number: 1,
      band_number: 'M1',
      weight: 2000,
      bet_amount: 10000,
      bet_collected_amount: 10000,
      bet_barcode: null,
      bet_scan_code: null,
      bet_payment_status: 'paid',
    },
    wala: {
      entry_id: 'e2',
      entry_number: '2',
      entry_name: 'Wala',
      owner_name: 'Owner W',
      rooster_id: 'r2',
      cock_number: 2,
      band_number: 'W1',
      weight: 2000,
      bet_amount: 5000,
      bet_collected_amount: 5000,
      bet_barcode: null,
      bet_scan_code: null,
      bet_payment_status: 'paid',
    },
    meron_palitada: [],
    wala_palitada: [],
  }
}

describe('matching-realtime-patches', () => {
  describe('patchMatchInList', () => {
    it('updates an existing match in place without changing order', () => {
      const first = buildMatch('match-1', 1)
      const second = buildMatch('match-2', 2)
      const updatedSecond = {
        ...second,
        wala_palitada: [
          {
            id: 'palitada-1',
            contributor_name: 'VIP Guest',
            contributor_type: 'vip' as const,
            amount: 2000,
          },
        ],
      }

      const result = patchMatchInList([first, second], updatedSecond)

      expect(result).toHaveLength(2)
      expect(result[0]?.id).toBe('match-1')
      expect(result[1]?.id).toBe('match-2')
      expect(result[1]?.wala_palitada).toEqual(updatedSecond.wala_palitada)
    })

    it('appends a match that is not already in the list', () => {
      const existing = buildMatch('match-1', 1)
      const incoming = buildMatch('match-3', 3)

      const result = patchMatchInList([existing], incoming)

      expect(result).toHaveLength(2)
      expect(result[1]?.id).toBe('match-3')
    })
  })

  describe('removeMatchFromList', () => {
    it('removes a match by id', () => {
      const first = buildMatch('match-1', 1)
      const second = buildMatch('match-2', 2)

      expect(removeMatchFromList([first, second], 'match-1')).toEqual([second])
    })
  })

  describe('removePalitadaContributionFromMatch', () => {
    it('removes a palitada contributor from either side', () => {
      const match = {
        ...buildMatch('match-1', 1),
        wala_palitada: [
          {
            id: 'palitada-1',
            contributor_name: 'VIP Guest',
            contributor_type: 'vip' as const,
            amount: 2000,
          },
          {
            id: 'palitada-2',
            contributor_name: 'Monton',
            contributor_type: 'monton' as const,
            amount: 1000,
          },
        ],
      }

      const result = removePalitadaContributionFromMatch([match], 'match-1', 'palitada-1')

      expect(result[0]?.wala_palitada).toEqual([match.wala_palitada[1]])
    })
  })

  describe('removeSettlingMatch', () => {
    it('removes a settling match by id', () => {
      const match = {
        ...buildMatch('match-1', 1),
        result_type: 'meron_win' as const,
        obligations: [],
      }

      expect(removeSettlingMatch([match], 'match-1')).toEqual([])
    })
  })

  describe('upsertSettlingMatch', () => {
    function buildSettlingMatch(
      id: string,
      fightNumber: number,
      matchingNumber: string | null = null
    ): SettlingMatchListItem {
      return {
        ...buildMatch(id, fightNumber),
        matching_number: matchingNumber,
        result_type: 'meron_win',
        obligations: [],
      }
    }

    it('inserts a new settling match sorted by matching code', () => {
      const existing = buildSettlingMatch('match-2', 2, 'B-002')
      const incoming = buildSettlingMatch('match-1', 1, 'A-001')

      const result = upsertSettlingMatch([existing], incoming)

      expect(result.map((row) => row.id)).toEqual(['match-1', 'match-2'])
    })

    it('replaces an existing settling match in place', () => {
      const match = buildSettlingMatch('match-1', 1, 'A-001')
      const updated = {
        ...match,
        obligations: [
          {
            id: 'obligation-1',
            match_id: 'match-1',
            event_id: 'event-1',
            obligation_key: 'handler-win',
            obligation_type: 'handler_win_payout',
            label: 'Pay winner',
            description: null,
            amount: 5000,
            status: 'paid',
            requires_ledger_post: false,
            contributor_id: null,
            ledger_entry_id: null,
            paid_at: null,
            paid_by: null,
            payment_id: null,
            sort_order: 1,
          },
        ],
      }

      const result = upsertSettlingMatch([match], updated)

      expect(result).toHaveLength(1)
      expect(result[0]?.obligations).toHaveLength(1)
      expect(result[0]?.obligations[0]?.status).toBe('paid')
    })
  })

  describe('sortSettlingMatches', () => {
    it('sorts by matching_number then fight_number', () => {
      const matches: SettlingMatchListItem[] = [
        {
          ...buildMatch('match-3', 3),
          matching_number: 'Z-003',
          result_type: 'meron_win',
          obligations: [],
        },
        {
          ...buildMatch('match-1', 1),
          matching_number: 'A-001',
          result_type: 'meron_win',
          obligations: [],
        },
        {
          ...buildMatch('match-2', 2),
          matching_number: null,
          result_type: 'meron_win',
          obligations: [],
        },
      ]

      const result = sortSettlingMatches(matches)

      expect(result.map((row) => row.id)).toEqual(['match-1', 'match-3', 'match-2'])
    })
  })
})
