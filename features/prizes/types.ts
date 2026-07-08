import type { PrizeConfigEntry, PrizeType } from '@/features/events/types'

export type PrizePoolBreakdown = {
  entryCount: number
  entryFee: number
  grossCollection: number
  houseDeduction: number
  venueShare: number
  totalDeductions: number
  promoterCommission: number
  netBeforeGuarantee: number
  guaranteedPrizeAmount: number
  prizePool: number
}

export type PrizeAllocation = {
  place: number
  label: string
  entryId: string
  entryNumber: string
  entryName: string
  ownerName: string
  amount: number
  rankPosition: number
}

export type PrizeStructureInput = {
  prizeType: PrizeType
  config: PrizeConfigEntry[]
}
