import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

const { createClient } = vi.hoisted(() => ({
  createClient: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({ createClient }))

import {
  resolveCashierTarget,
  resolveMatchBetByRoosterRegistrationId,
} from '@/features/payments/service'

const eventId = '00000000-0000-4000-8000-000000000001'
const registrationId = '00000000-0000-4000-8000-000000000002'
const entryId = '00000000-0000-4000-8000-000000000003'
const matchId = '00000000-0000-4000-8000-000000000004'
const matchBetId = '00000000-0000-4000-8000-000000000005'
const cockBarcode = `COCK-${eventId.slice(0, 8).toUpperCase()}-0001`

const entryRow = {
  id: entryId,
  entry_number: '001',
  entry_name: 'Monton Hotel',
  owner_name: 'Owner One',
  owner_barcode: 'OWN-TEST-001',
  payment_status: 'unpaid',
  fee_snapshot: null,
}

const draftMatch = {
  id: matchId,
  fight_number: 1,
  status: 'draft',
  meron_entry_id: entryId,
  wala_entry_id: '00000000-0000-4000-8000-000000000099',
  meron_rooster_id: registrationId,
  wala_rooster_id: '00000000-0000-4000-8000-000000000098',
}

const unpaidBet = {
  id: matchBetId,
  match_id: matchId,
  side: 'meron',
  amount: 500,
  barcode: `BET-${eventId.slice(0, 8).toUpperCase()}-0001-M`,
  payment_status: 'unpaid',
}

const eventFees = {
  entry_fee: 0,
  registration_fee_enabled: false,
  registration_fee_amount: 0,
  rooster_entry_fee_enabled: false,
  rooster_entry_fee_amount: 0,
  cash_bond_enabled: false,
  cash_bond_amount: 0,
}

function chainable(resolver: () => Promise<{ data: unknown; error: null }>) {
  const chain: Record<string, unknown> = {}
  for (const method of ['select', 'eq', 'is', 'or', 'order', 'limit', 'neq', 'in']) {
    chain[method] = vi.fn(() => chain)
  }
  chain.maybeSingle = vi.fn(async () => resolver())
  chain.then = (
    onFulfilled: (value: { data: unknown; error: null }) => unknown,
    onRejected?: (reason: unknown) => unknown
  ) => resolver().then(onFulfilled, onRejected)
  return chain
}

function setupSupabaseMock(options: {
  match: typeof draftMatch | null
  bet: typeof unpaidBet | null
  registrationLookup?: { id: string; entry_id: string } | null
}) {
  vi.mocked(createClient).mockResolvedValue({
    from: vi.fn((table: string) => {
      if (table === 'matches') {
        return chainable(async () => ({
          data: options.match,
          error: null,
        }))
      }

      if (table === 'match_bets') {
        return chainable(async () => ({
          data: options.bet,
          error: null,
        }))
      }

      if (table === 'rooster_event_registrations') {
        return {
          select: vi.fn((_cols: string, opts?: { count?: string; head?: boolean }) => {
            if (opts?.head) {
              return {
                eq: vi.fn().mockResolvedValue({ count: 1, error: null }),
              }
            }

            const registrationLookup = options.registrationLookup ?? {
              id: registrationId,
              entry_id: entryId,
            }

            return {
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: registrationLookup,
                    error: null,
                  }),
                }),
                maybeSingle: vi.fn().mockResolvedValue({
                  data: { cock_number: 1, band_number: 'A1' },
                  error: null,
                }),
              }),
            }
          }),
        }
      }

      if (table === 'entries') {
        return chainable(async () => ({
          data: entryRow,
          error: null,
        }))
      }

      if (table === 'events') {
        return chainable(async () => ({
          data: eventFees,
          error: null,
        }))
      }

      if (table === 'payments') {
        return chainable(async () => ({
          data: [],
          error: null,
        }))
      }

      if (table === 'entry_fee_adjustment_lines') {
        return chainable(async () => ({
          data: [],
          error: null,
        }))
      }

      throw new Error(`Unexpected table: ${table}`)
    }),
  } as never)
}

describe('resolveMatchBetByRoosterRegistrationId', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns unpaid palitada target for a rooster in a draft match', async () => {
    setupSupabaseMock({ match: draftMatch, bet: unpaidBet })

    const result = await resolveMatchBetByRoosterRegistrationId(eventId, registrationId)

    expect(result.error).toBeUndefined()
    expect(result.matchBet).toMatchObject({
      matchBetId,
      matchId,
      betAmount: 500,
      betPaymentStatus: 'unpaid',
      side: 'meron',
      entryId,
      cockNumber: 1,
    })
  })

  it('returns empty when rooster is not in a draft match', async () => {
    setupSupabaseMock({ match: null, bet: null })

    const result = await resolveMatchBetByRoosterRegistrationId(eventId, registrationId)

    expect(result.error).toBeUndefined()
    expect(result.matchBet).toBeUndefined()
  })

  it('returns empty when palitada is already paid', async () => {
    setupSupabaseMock({ match: draftMatch, bet: null })

    const result = await resolveMatchBetByRoosterRegistrationId(eventId, registrationId)

    expect(result.error).toBeUndefined()
    expect(result.matchBet).toBeUndefined()
  })
})

describe('resolveCashierTarget cock barcode', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns matchBet when cock scan resolves unpaid palitada', async () => {
    setupSupabaseMock({ match: draftMatch, bet: unpaidBet })

    const result = await resolveCashierTarget(eventId, cockBarcode)

    expect(result.error).toBeUndefined()
    expect(result.matchBet).toMatchObject({
      matchBetId,
      betAmount: 500,
      betPaymentStatus: 'unpaid',
    })
    expect(result.matches).toBeUndefined()
  })
})
