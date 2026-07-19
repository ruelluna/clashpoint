import type { EventFeeSettings } from '@/features/events/fee-utils'
import {
  computeCategoryAmountDue,
  type PaymentCategory,
} from '@/features/payments/fee-calc'
import { PAYMENT_CATEGORY_LABELS } from '@/features/payments/schema'

export type OutstandingDueLine = {
  category: PaymentCategory
  label: string
  amountDue: number
  amountPaid: number
  outstanding: number
}

export type EntryOutstandingDues = {
  lines: OutstandingDueLine[]
  totalOutstanding: number
  suggestedCategory: PaymentCategory | null
  suggestedAmount: number
}

function roundMoney(value: number): number {
  return Number(value.toFixed(2))
}

const CASHIER_CATEGORIES: PaymentCategory[] = [
  'registration',
  'rooster_entry',
  'cash_bond',
]

export function computeOutstandingDues(
  settings: EventFeeSettings,
  roosterCount: number,
  paidByCategory: Partial<Record<PaymentCategory, number>>,
  adjustmentCollectDue = 0,
  adjustmentPaid = 0
): EntryOutstandingDues {
  const lines: OutstandingDueLine[] = []

  for (const category of CASHIER_CATEGORIES) {
    const amountDue = computeCategoryAmountDue(category, settings, roosterCount)
    if (amountDue <= 0) continue

    const amountPaid = roundMoney(paidByCategory[category] ?? 0)
    const outstanding = roundMoney(Math.max(0, amountDue - amountPaid))
    lines.push({
      category,
      label: PAYMENT_CATEGORY_LABELS[category],
      amountDue,
      amountPaid,
      outstanding,
    })
  }

  const adjustmentDue = roundMoney(Math.max(0, adjustmentCollectDue))
  if (adjustmentDue > 0) {
    const paid = roundMoney(Math.max(0, adjustmentPaid))
    const outstanding = roundMoney(Math.max(0, adjustmentDue - paid))
    lines.push({
      category: 'adjustment',
      label: PAYMENT_CATEGORY_LABELS.adjustment,
      amountDue: adjustmentDue,
      amountPaid: paid,
      outstanding,
    })
  }

  const totalOutstanding = roundMoney(
    lines.reduce((sum, line) => sum + line.outstanding, 0)
  )

  const firstOpen = lines.find((line) => line.outstanding > 0) ?? null

  return {
    lines,
    totalOutstanding,
    suggestedCategory: firstOpen?.category ?? null,
    suggestedAmount: firstOpen?.outstanding ?? 0,
  }
}

export function classifyCashierQuery(
  raw: string,
  eventId: string
): { kind: 'owner_barcode' | 'cock_barcode' | 'search'; value: string } {
  const value = raw.trim().toUpperCase()
  const eventPrefix = eventId.replace(/-/g, '').slice(0, 8).toUpperCase()

  if (value.startsWith(`OWN-${eventPrefix}-`)) {
    return { kind: 'owner_barcode', value }
  }
  if (value.startsWith(`COCK-${eventPrefix}-`)) {
    return { kind: 'cock_barcode', value }
  }
  if (value.startsWith('OWN-') || value.startsWith('COCK-')) {
    return { kind: 'search', value: raw.trim() }
  }

  return { kind: 'search', value: raw.trim() }
}
