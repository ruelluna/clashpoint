import type { EntryFeeSnapshot } from '@/features/events/fee-utils'
import {
  computePaymentStageAmountDue,
  computeRegistrationAmountDue,
  computeTotalEntryAmountDue,
  eventFeeSettingsFromRow,
  type EventFeeSettings,
} from '@/features/events/fee-utils'

export function resolveEntryFeeSettings(
  eventRow: Parameters<typeof eventFeeSettingsFromRow>[0],
  feeSnapshot: EntryFeeSnapshot | null | undefined
): EventFeeSettings {
  if (feeSnapshot) return feeSnapshot
  return eventFeeSettingsFromRow(eventRow)
}

export function computeEntryTotalDue(
  settings: EventFeeSettings,
  roosterCount: number
): number {
  return computeTotalEntryAmountDue(settings, roosterCount)
}

export function computeEntryRegistrationDue(settings: EventFeeSettings): number {
  return computeRegistrationAmountDue(settings)
}

export function computeEntryStageThreeDue(
  settings: EventFeeSettings,
  roosterCount: number
): number {
  return computePaymentStageAmountDue(settings, roosterCount)
}

export type PaymentCategory =
  | 'registration'
  | 'rooster_entry'
  | 'entry_fees'
  | 'cash_bond'
  | 'adjustment'
  | 'legacy'

export function computeCategoryAmountDue(
  category: PaymentCategory,
  settings: EventFeeSettings,
  roosterCount: number
): number {
  switch (category) {
    case 'registration':
      return computeRegistrationAmountDue(settings)
    case 'rooster_entry':
      if (!settings.roosterEntryFeeEnabled) return 0
      return Number((settings.roosterEntryFeeAmount * Math.max(0, roosterCount)).toFixed(2))
    case 'entry_fees':
      return Number(
        (
          computeRegistrationAmountDue(settings) +
          (settings.roosterEntryFeeEnabled
            ? settings.roosterEntryFeeAmount * Math.max(0, roosterCount)
            : 0)
        ).toFixed(2)
      )
    case 'cash_bond':
      if (!settings.cashBondEnabled) return 0
      return settings.cashBondAmount
    case 'adjustment':
    case 'legacy':
    default:
      return computeTotalEntryAmountDue(settings, roosterCount)
  }
}
