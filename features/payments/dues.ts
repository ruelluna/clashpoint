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

export type CashierPaymentCategoryOption = {
  category: PaymentCategory
  label: string
  outstanding: number
}

const ENTRY_FEE_LINE_CATEGORIES: PaymentCategory[] = ['registration', 'rooster_entry']

function roundMoney(value: number): number {
  return Number(value.toFixed(2))
}

const CASHIER_CATEGORIES: PaymentCategory[] = [
  'registration',
  'rooster_entry',
  'cash_bond',
]

function allocateEntryFeesPaid(
  entryFeesPaid: number,
  registrationDue: number,
  registrationPaid: number,
  roosterDue: number,
  roosterPaid: number
): { registrationPaid: number; roosterPaid: number } {
  let remaining = roundMoney(Math.max(0, entryFeesPaid))

  const registrationOutstanding = roundMoney(
    Math.max(0, registrationDue - registrationPaid)
  )
  const toRegistration = roundMoney(Math.min(remaining, registrationOutstanding))
  registrationPaid = roundMoney(registrationPaid + toRegistration)
  remaining = roundMoney(remaining - toRegistration)

  const roosterOutstanding = roundMoney(Math.max(0, roosterDue - roosterPaid))
  const toRooster = roundMoney(Math.min(remaining, roosterOutstanding))
  roosterPaid = roundMoney(roosterPaid + toRooster)

  return { registrationPaid, roosterPaid }
}

function buildEntryFeeLines(
  settings: EventFeeSettings,
  roosterCount: number,
  paidByCategory: Partial<Record<PaymentCategory, number>>
): OutstandingDueLine[] {
  const lines: OutstandingDueLine[] = []

  let registrationDue = 0
  let registrationPaid = roundMoney(paidByCategory.registration ?? 0)
  let roosterDue = 0
  let roosterPaid = roundMoney(paidByCategory.rooster_entry ?? 0)

  for (const category of ENTRY_FEE_LINE_CATEGORIES) {
    const amountDue = computeCategoryAmountDue(category, settings, roosterCount)
    if (amountDue <= 0) continue

    if (category === 'registration') {
      registrationDue = amountDue
    } else {
      roosterDue = amountDue
    }
  }

  const allocated = allocateEntryFeesPaid(
    paidByCategory.entry_fees ?? 0,
    registrationDue,
    registrationPaid,
    roosterDue,
    roosterPaid
  )
  registrationPaid = allocated.registrationPaid
  roosterPaid = allocated.roosterPaid

  if (registrationDue > 0) {
    lines.push({
      category: 'registration',
      label: PAYMENT_CATEGORY_LABELS.registration,
      amountDue: registrationDue,
      amountPaid: registrationPaid,
      outstanding: roundMoney(Math.max(0, registrationDue - registrationPaid)),
    })
  }

  if (roosterDue > 0) {
    lines.push({
      category: 'rooster_entry',
      label: PAYMENT_CATEGORY_LABELS.rooster_entry,
      amountDue: roosterDue,
      amountPaid: roosterPaid,
      outstanding: roundMoney(Math.max(0, roosterDue - roosterPaid)),
    })
  }

  return lines
}

export function splitEntryFeesPayment(
  amountPaid: number,
  lines: OutstandingDueLine[]
): { registration: number; rooster_entry: number } {
  let remaining = roundMoney(Math.max(0, amountPaid))
  const registrationLine = lines.find((line) => line.category === 'registration')
  const roosterLine = lines.find((line) => line.category === 'rooster_entry')

  const toRegistration = roundMoney(
    Math.min(remaining, registrationLine?.outstanding ?? 0)
  )
  remaining = roundMoney(remaining - toRegistration)

  const toRooster = roundMoney(Math.min(remaining, roosterLine?.outstanding ?? 0))

  return {
    registration: toRegistration,
    rooster_entry: toRooster,
  }
}

export function getEntryFeesOutstanding(lines: OutstandingDueLine[]): number {
  return roundMoney(
    lines
      .filter((line) => ENTRY_FEE_LINE_CATEGORIES.includes(line.category))
      .reduce((sum, line) => sum + line.outstanding, 0)
  )
}

export function getCashierPaymentCategoryOptions(
  dues: EntryOutstandingDues
): CashierPaymentCategoryOption[] {
  const options: CashierPaymentCategoryOption[] = []

  for (const category of ['cash_bond', 'adjustment'] as const) {
    const line = dues.lines.find((item) => item.category === category)
    if (line && line.outstanding > 0) {
      options.push({
        category,
        label: line.label,
        outstanding: line.outstanding,
      })
    }
  }

  return options
}

export function computeOutstandingDues(
  settings: EventFeeSettings,
  roosterCount: number,
  paidByCategory: Partial<Record<PaymentCategory, number>>,
  adjustmentCollectDue = 0,
  adjustmentPaid = 0
): EntryOutstandingDues {
  const lines: OutstandingDueLine[] = [
    ...buildEntryFeeLines(settings, roosterCount, paidByCategory),
  ]

  const cashBondDue = computeCategoryAmountDue('cash_bond', settings, roosterCount)
  if (cashBondDue > 0) {
    const amountPaid = roundMoney(paidByCategory.cash_bond ?? 0)
    const outstanding = roundMoney(Math.max(0, cashBondDue - amountPaid))
    lines.push({
      category: 'cash_bond',
      label: PAYMENT_CATEGORY_LABELS.cash_bond,
      amountDue: cashBondDue,
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

  const entryFeesOutstanding = getEntryFeesOutstanding(lines)
  const firstNonEntryOpen =
    lines.find(
      (line) =>
        line.outstanding > 0 &&
        !ENTRY_FEE_LINE_CATEGORIES.includes(line.category)
    ) ?? null

  const suggestedCategory =
    entryFeesOutstanding > 0
      ? null
      : (firstNonEntryOpen?.category ?? null)
  const suggestedAmount =
    entryFeesOutstanding > 0
      ? entryFeesOutstanding
      : (firstNonEntryOpen?.outstanding ?? 0)

  return {
    lines,
    totalOutstanding,
    suggestedCategory,
    suggestedAmount,
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
