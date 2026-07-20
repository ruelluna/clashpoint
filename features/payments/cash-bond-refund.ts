import type { RegistrationWorkflowStatus } from '@/lib/derby/enums'

export type CashBondRefundEligibility = {
  eligible: boolean
  reason?: string
  paymentId?: string
  refundableAmount?: number
  allRoostersDone: boolean
  hasWithdrawnRooster: boolean
}

export type RoosterRefundContext = {
  id: string
  registrationStatus: RegistrationWorkflowStatus | string
}

export type MatchRefundContext = {
  status: string
  meronEntryId: string
  walaEntryId: string
  meronRoosterId: string
  walaRoosterId: string
}

export type CashBondPaymentContext = {
  id: string
  amountPaid: number
  paymentStatus: string
} | null

export const CASH_BOND_PAID_DISPLAY_LABEL = 'Cash bond (Can be refunded after match)'

function isRoosterDone(
  rooster: RoosterRefundContext,
  matches: MatchRefundContext[]
): boolean {
  if (rooster.registrationStatus === 'withdrawn') return true
  if (rooster.registrationStatus === 'disqualified') return true
  if (rooster.registrationStatus === 'completed') return true

  return matches.some(
    (match) =>
      match.status === 'completed' &&
      (match.meronRoosterId === rooster.id || match.walaRoosterId === rooster.id)
  )
}

export function evaluateCashBondRefundEligibility(
  roosters: RoosterRefundContext[],
  matches: MatchRefundContext[],
  cashBondPayment: CashBondPaymentContext
): CashBondRefundEligibility {
  const hasWithdrawnRooster = roosters.some(
    (rooster) => rooster.registrationStatus === 'withdrawn'
  )
  const allRoostersDone =
    roosters.length === 0 || roosters.every((rooster) => isRoosterDone(rooster, matches))

  if (!cashBondPayment) {
    return {
      eligible: false,
      reason: 'Cash bond not yet collected',
      allRoostersDone,
      hasWithdrawnRooster,
    }
  }

  if (cashBondPayment.paymentStatus === 'refunded') {
    return {
      eligible: false,
      reason: 'Already refunded',
      allRoostersDone,
      hasWithdrawnRooster,
    }
  }

  if (cashBondPayment.amountPaid <= 0) {
    return {
      eligible: false,
      reason: 'Cash bond not yet collected',
      allRoostersDone,
      hasWithdrawnRooster,
    }
  }

  if (hasWithdrawnRooster) {
    return {
      eligible: false,
      reason: 'Owner withdrew — bond forfeited',
      allRoostersDone,
      hasWithdrawnRooster: true,
    }
  }

  if (!allRoostersDone) {
    return {
      eligible: false,
      reason: 'Match not completed yet',
      allRoostersDone: false,
      hasWithdrawnRooster: false,
    }
  }

  return {
    eligible: true,
    paymentId: cashBondPayment.id,
    refundableAmount: cashBondPayment.amountPaid,
    allRoostersDone: true,
    hasWithdrawnRooster: false,
  }
}
