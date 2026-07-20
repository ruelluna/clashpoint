import type { EntryFeeSnapshot } from '@/features/events/fee-utils'
import { resolveEntryFeeSettings } from '@/features/payments/fee-calc'
import type { PaymentCategory } from '@/features/payments/fee-calc'
import { computeOutstandingDues } from '@/features/payments/dues'
import type { CashierSelectableEntry } from '@/features/payments/types'

export type CashierSelectableEntrySource = {
  id: string
  entryNumber: string
  entryName: string
  ownerName: string
  feeSnapshot: EntryFeeSnapshot | null
  roosterCount: number
  paidByCategory: Partial<Record<PaymentCategory, number>>
  adjustmentCollectDue: number
  adjustmentPaid: number
}

export type EventFeeRow = Parameters<typeof resolveEntryFeeSettings>[0]

export function buildCashierSelectableEntry(
  eventFeeRow: EventFeeRow,
  source: CashierSelectableEntrySource
): CashierSelectableEntry | null {
  const settings = resolveEntryFeeSettings(eventFeeRow, source.feeSnapshot)
  const dues = computeOutstandingDues(
    settings,
    source.roosterCount,
    source.paidByCategory,
    source.adjustmentCollectDue,
    source.adjustmentPaid
  )

  if (dues.totalOutstanding <= 0) {
    return null
  }

  return {
    id: source.id,
    entryNumber: source.entryNumber,
    entryName: source.entryName,
    ownerName: source.ownerName,
    totalOutstanding: dues.totalOutstanding,
  }
}

export function aggregatePaidByCategoryForEntries(
  payments: Array<{
    entry_id: string
    payment_category: string
    amount_paid: number
  }>
): Map<string, Partial<Record<PaymentCategory, number>>> {
  const byEntry = new Map<string, Partial<Record<PaymentCategory, number>>>()

  for (const row of payments) {
    const category = row.payment_category as PaymentCategory
    const current = byEntry.get(row.entry_id) ?? {}
    current[category] = Number(
      ((current[category] ?? 0) + Number(row.amount_paid)).toFixed(2)
    )
    byEntry.set(row.entry_id, current)
  }

  return byEntry
}

export function aggregateRoosterCounts(
  rows: Array<{ entry_id: string }>
): Map<string, number> {
  const counts = new Map<string, number>()

  for (const row of rows) {
    counts.set(row.entry_id, (counts.get(row.entry_id) ?? 0) + 1)
  }

  return counts
}

export function aggregateAdjustmentCollectDue(
  lines: Array<{ entry_id: string; delta: number }>
): Map<string, number> {
  const byEntry = new Map<string, number>()

  for (const line of lines) {
    const delta = Number(line.delta)
    if (delta <= 0) continue
    byEntry.set(
      line.entry_id,
      Number(((byEntry.get(line.entry_id) ?? 0) + delta).toFixed(2))
    )
  }

  return byEntry
}
