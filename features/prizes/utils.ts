import type { CommissionType } from '@/features/promoters/types'
import type { PrizePoolBreakdown, PrizeAllocation, PrizeStructureInput } from '@/features/prizes/types'
import type { PrizeConfigEntry } from '@/features/events/types'

export type ComputePrizePoolInput = {
  entryCount: number
  entryFee: number
  houseDeduction?: number | null
  venueShare?: number | null
  promoterCommissionType?: CommissionType
  promoterCommissionValue?: number | null
  guaranteedPrizeAmount?: number | null
}

export type WinnerForPrize = {
  entryId: string
  entryNumber: string
  entryName: string
  ownerName: string
  rank: number
}

function roundMoney(value: number): number {
  return Number(value.toFixed(2))
}

export function computeGrossCollection(entryCount: number, entryFee: number): number {
  return roundMoney(Math.max(0, entryCount) * Math.max(0, entryFee))
}

export function computeTotalDeductions(
  houseDeduction?: number | null,
  venueShare?: number | null
): number {
  return roundMoney(Math.max(0, houseDeduction ?? 0) + Math.max(0, venueShare ?? 0))
}

export function computePromoterCommissionAmount(
  grossCollection: number,
  commissionType: CommissionType = 'none',
  commissionValue?: number | null
): number {
  if (commissionType === 'none' || commissionType === 'custom') return 0
  if (commissionType === 'fixed') return roundMoney(Math.max(0, commissionValue ?? 0))
  if (commissionType === 'percentage') {
    const rate = Math.max(0, Math.min(100, commissionValue ?? 0))
    return roundMoney(grossCollection * (rate / 100))
  }
  return 0
}

export function computePrizePool(input: ComputePrizePoolInput): PrizePoolBreakdown {
  const entryCount = Math.max(0, input.entryCount)
  const entryFee = Math.max(0, input.entryFee)
  const grossCollection = computeGrossCollection(entryCount, entryFee)
  const houseDeduction = roundMoney(Math.max(0, input.houseDeduction ?? 0))
  const venueShare = roundMoney(Math.max(0, input.venueShare ?? 0))
  const totalDeductions = roundMoney(houseDeduction + venueShare)
  const promoterCommission = computePromoterCommissionAmount(
    grossCollection,
    input.promoterCommissionType,
    input.promoterCommissionValue
  )
  const netBeforeGuarantee = roundMoney(
    Math.max(0, grossCollection - totalDeductions - promoterCommission)
  )
  const guaranteedPrizeAmount = roundMoney(Math.max(0, input.guaranteedPrizeAmount ?? 0))
  const prizePool = roundMoney(Math.max(netBeforeGuarantee, guaranteedPrizeAmount))

  return {
    entryCount,
    entryFee,
    grossCollection,
    houseDeduction,
    venueShare,
    totalDeductions,
    promoterCommission,
    netBeforeGuarantee,
    guaranteedPrizeAmount,
    prizePool,
  }
}

function winnersForPlace(
  winners: WinnerForPrize[],
  place: number
): WinnerForPrize[] {
  return winners.filter((winner) => winner.rank === place)
}

function amountForTier(
  prizeType: PrizeStructureInput['prizeType'],
  configEntry: PrizeConfigEntry,
  prizePool: number,
  recipientCount: number
): number {
  if (recipientCount <= 0) return 0

  if (prizeType === 'percentage') {
    const tierTotal = prizePool * ((configEntry.value ?? 0) / 100)
    return roundMoney(tierTotal / recipientCount)
  }

  if (prizeType === 'fixed') {
    return roundMoney((configEntry.value ?? 0) / recipientCount)
  }

  return 0
}

export function distributePrizes(
  prizeStructure: PrizeStructureInput,
  prizePool: number,
  winners: WinnerForPrize[]
): PrizeAllocation[] {
  if (prizePool <= 0 || winners.length === 0) return []

  const sortedConfig = [...prizeStructure.config].sort((a, b) => a.place - b.place)
  const allocations: PrizeAllocation[] = []

  for (const tier of sortedConfig) {
    const tierWinners = winnersForPlace(winners, tier.place)
    if (tierWinners.length === 0) continue

    const amount = amountForTier(
      prizeStructure.prizeType,
      tier,
      prizePool,
      tierWinners.length
    )

    for (const winner of tierWinners) {
      allocations.push({
        place: tier.place,
        label: tier.label,
        entryId: winner.entryId,
        entryNumber: winner.entryNumber,
        entryName: winner.entryName,
        ownerName: winner.ownerName,
        amount,
        rankPosition: tier.place,
      })
    }
  }

  return allocations
}
