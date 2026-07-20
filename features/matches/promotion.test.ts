import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

const { writeAuditLog, createClient, getEntryOutstandingDues } = vi.hoisted(() => ({
  writeAuditLog: vi.fn(),
  createClient: vi.fn(),
  getEntryOutstandingDues: vi.fn(),
}))

vi.mock('@/features/audit/service', () => ({ writeAuditLog }))
vi.mock('@/features/payments/service', () => ({ getEntryOutstandingDues }))
vi.mock('@/lib/supabase/server', () => ({ createClient }))

import { revertPledgePaymentSideEffects } from '@/features/matches/promotion'

const matchBetId = '00000000-0000-4000-8000-000000000010'
const matchId = '00000000-0000-4000-8000-000000000011'
const meronEntryId = '00000000-0000-4000-8000-000000000012'
const walaEntryId = '00000000-0000-4000-8000-000000000013'
const actorId = '00000000-0000-4000-8000-000000000099'

type MatchRow = {
  id: string
  event_id: string
  fight_number: number
  status: string
  queue_status: string | null
  meron_entry_id: string
  wala_entry_id: string
}

function setupPromotionMock(options: {
  match: MatchRow
  betsAfterRevert: Array<{ side: string; payment_status: string }>
}) {
  let capturedBetUpdate: Record<string, unknown> | null = null
  let capturedMatchUpdate: Record<string, unknown> | null = null

  vi.mocked(createClient).mockResolvedValue({
    from: vi.fn((table: string) => {
      if (table === 'match_bets') {
        return {
          update: vi.fn((payload: Record<string, unknown>) => {
            capturedBetUpdate = payload
            return {
              eq: vi.fn().mockResolvedValue({ error: null }),
            }
          }),
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: options.betsAfterRevert,
              error: null,
            }),
          }),
        }
      }

      if (table === 'matches') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({ data: options.match, error: null }),
            }),
          }),
          update: vi.fn((payload: Record<string, unknown>) => {
            capturedMatchUpdate = payload
            return {
              eq: vi.fn().mockResolvedValue({ error: null }),
            }
          }),
        }
      }

      throw new Error(`Unexpected table: ${table}`)
    }),
  } as never)

  return {
    getCapturedBetUpdate: () => capturedBetUpdate,
    getCapturedMatchUpdate: () => capturedMatchUpdate,
  }
}

describe('revertPledgePaymentSideEffects', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getEntryOutstandingDues).mockResolvedValue({
      dues: { totalOutstanding: 0, lines: [] },
    })
  })

  it('reverts match bet to unpaid and demotes a scheduled match from the queue', async () => {
    const { getCapturedBetUpdate, getCapturedMatchUpdate } = setupPromotionMock({
      match: {
        id: matchId,
        event_id: '00000000-0000-4000-8000-000000000001',
        fight_number: 3,
        status: 'locked',
        queue_status: 'scheduled',
        meron_entry_id: meronEntryId,
        wala_entry_id: walaEntryId,
      },
      betsAfterRevert: [
        { side: 'meron', payment_status: 'unpaid' },
        { side: 'wala', payment_status: 'paid' },
      ],
    })

    const result = await revertPledgePaymentSideEffects(matchBetId, matchId, actorId)

    expect(result.error).toBeUndefined()
    expect(result.demoted).toBe(true)
    expect(getCapturedBetUpdate()).toEqual({
      payment_status: 'unpaid',
      payment_id: null,
      collected_amount: 0,
      updated_at: expect.any(String),
    })
    expect(getCapturedMatchUpdate()).toEqual({
      status: 'draft',
      queue_status: null,
      updated_at: expect.any(String),
    })
    expect(writeAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'match.demoted_from_queue' })
    )
    expect(writeAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'match_bet.payment_reverted' })
    )
  })

  it('blocks refund when the fight has already been called', async () => {
    setupPromotionMock({
      match: {
        id: matchId,
        event_id: '00000000-0000-4000-8000-000000000001',
        fight_number: 3,
        status: 'locked',
        queue_status: 'called',
        meron_entry_id: meronEntryId,
        wala_entry_id: walaEntryId,
      },
      betsAfterRevert: [],
    })

    const result = await revertPledgePaymentSideEffects(matchBetId, matchId, actorId)

    expect(result.error).toMatch(/called/)
    expect(writeAuditLog).not.toHaveBeenCalled()
  })
})
