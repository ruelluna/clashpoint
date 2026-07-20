import { describe, expect, it } from 'vitest'

import {
  evaluateCashBondRefundEligibility,
  type CashBondPaymentContext,
  type MatchRefundContext,
  type RoosterRefundContext,
} from '@/features/payments/cash-bond-refund'

const bondPayment: CashBondPaymentContext = {
  id: 'pay-bond-1',
  amountPaid: 2000,
  paymentStatus: 'paid',
}

function rooster(
  id: string,
  registrationStatus: RoosterRefundContext['registrationStatus']
): RoosterRefundContext {
  return { id, registrationStatus }
}

function completedMatchForRooster(roosterId: string): MatchRefundContext {
  return {
    status: 'completed',
    meronEntryId: 'entry-1',
    walaEntryId: 'entry-2',
    meronRoosterId: roosterId,
    walaRoosterId: 'other-rooster',
  }
}

describe('evaluateCashBondRefundEligibility', () => {
  it('blocks refund when bond is not collected', () => {
    const result = evaluateCashBondRefundEligibility(
      [rooster('r1', 'approved')],
      [],
      null
    )

    expect(result.eligible).toBe(false)
    expect(result.reason).toBe('Cash bond not yet collected')
  })

  it('blocks refund when match is still pending', () => {
    const result = evaluateCashBondRefundEligibility(
      [rooster('r1', 'matched')],
      [{ ...completedMatchForRooster('r1'), status: 'queued' }],
      bondPayment
    )

    expect(result.eligible).toBe(false)
    expect(result.allRoostersDone).toBe(false)
    expect(result.reason).toBe('Match not completed yet')
  })

  it('allows refund when all roosters fought in completed matches', () => {
    const result = evaluateCashBondRefundEligibility(
      [rooster('r1', 'matched'), rooster('r2', 'matched')],
      [completedMatchForRooster('r1'), completedMatchForRooster('r2')],
      bondPayment
    )

    expect(result).toEqual({
      eligible: true,
      paymentId: 'pay-bond-1',
      refundableAmount: 2000,
      allRoostersDone: true,
      hasWithdrawnRooster: false,
    })
  })

  it('allows refund when roosters are disqualified and none withdrew', () => {
    const result = evaluateCashBondRefundEligibility(
      [rooster('r1', 'disqualified'), rooster('r2', 'disqualified')],
      [],
      bondPayment
    )

    expect(result.eligible).toBe(true)
    expect(result.hasWithdrawnRooster).toBe(false)
  })

  it('forfeits bond when any rooster withdrew', () => {
    const result = evaluateCashBondRefundEligibility(
      [rooster('r1', 'withdrawn'), rooster('r2', 'matched')],
      [completedMatchForRooster('r2')],
      bondPayment
    )

    expect(result.eligible).toBe(false)
    expect(result.hasWithdrawnRooster).toBe(true)
    expect(result.reason).toBe('Owner withdrew — bond forfeited')
  })

  it('blocks refund when bond was already refunded', () => {
    const result = evaluateCashBondRefundEligibility(
      [rooster('r1', 'completed')],
      [],
      { id: 'pay-bond-1', amountPaid: 0, paymentStatus: 'refunded' }
    )

    expect(result.eligible).toBe(false)
    expect(result.reason).toBe('Already refunded')
  })

  it('waits until every rooster on the entry is done', () => {
    const result = evaluateCashBondRefundEligibility(
      [rooster('r1', 'matched'), rooster('r2', 'approved')],
      [completedMatchForRooster('r1')],
      bondPayment
    )

    expect(result.eligible).toBe(false)
    expect(result.allRoostersDone).toBe(false)
    expect(result.reason).toBe('Match not completed yet')
  })
})
