export type EventFeeSettings = {
  registrationFeeEnabled: boolean
  registrationFeeAmount: number
  roosterEntryFeeEnabled: boolean
  roosterEntryFeeAmount: number
  cashBondEnabled: boolean
  cashBondAmount: number
}

export type EntryFeeSnapshot = EventFeeSettings

function roundMoney(value: number): number {
  return Number(value.toFixed(2))
}

export function eventFeeSettingsFromRow(row: {
  registration_fee_enabled?: boolean | null
  registration_fee_amount?: number | null
  rooster_entry_fee_enabled?: boolean | null
  rooster_entry_fee_amount?: number | null
  cash_bond_enabled?: boolean | null
  cash_bond_amount?: number | null
  entry_fee?: number | null
}): EventFeeSettings {
  const legacyEntryFee = Number(row.entry_fee ?? 0)
  const registrationEnabled =
    row.registration_fee_enabled ?? legacyEntryFee > 0
  const registrationAmount =
    row.registration_fee_amount != null
      ? Number(row.registration_fee_amount)
      : legacyEntryFee

  return {
    registrationFeeEnabled: Boolean(registrationEnabled),
    registrationFeeAmount: roundMoney(Math.max(0, registrationAmount)),
    roosterEntryFeeEnabled: Boolean(row.rooster_entry_fee_enabled),
    roosterEntryFeeAmount: roundMoney(Math.max(0, Number(row.rooster_entry_fee_amount ?? 0))),
    cashBondEnabled: Boolean(row.cash_bond_enabled),
    cashBondAmount: roundMoney(Math.max(0, Number(row.cash_bond_amount ?? 0))),
  }
}

export function computeRegistrationAmountDue(settings: EventFeeSettings): number {
  if (!settings.registrationFeeEnabled) return 0
  return roundMoney(settings.registrationFeeAmount)
}

export function computePaymentStageAmountDue(
  settings: EventFeeSettings,
  roosterCount: number
): number {
  let total = 0

  if (settings.roosterEntryFeeEnabled) {
    total += settings.roosterEntryFeeAmount * Math.max(0, roosterCount)
  }

  if (settings.cashBondEnabled) {
    total += settings.cashBondAmount
  }

  return roundMoney(total)
}

export function computeTotalEntryAmountDue(
  settings: EventFeeSettings,
  roosterCount: number
): number {
  return roundMoney(
    computeRegistrationAmountDue(settings) +
      computePaymentStageAmountDue(settings, roosterCount)
  )
}

export function snapshotFromSettings(settings: EventFeeSettings): EntryFeeSnapshot {
  return { ...settings }
}

export type FeeAdjustmentLine = {
  entryId: string
  previousAmountDue: number
  newAmountDue: number
  amountPaid: number
  delta: number
}

export function computeFeeAdjustmentLines(
  entries: Array<{ id: string; feeSnapshot: EntryFeeSnapshot | null; roosterCount: number }>,
  previousSettings: EventFeeSettings,
  newSettings: EventFeeSettings,
  amountPaidByEntry: Map<string, number>
): FeeAdjustmentLine[] {
  const lines: FeeAdjustmentLine[] = []

  for (const entry of entries) {
    const snapshot = entry.feeSnapshot ?? previousSettings
    const amountPaid = amountPaidByEntry.get(entry.id) ?? 0
    if (amountPaid <= 0) continue

    const previousDue = computeTotalEntryAmountDue(snapshot, entry.roosterCount)
    const newDue = computeTotalEntryAmountDue(newSettings, entry.roosterCount)
    const delta = roundMoney(newDue - previousDue)

    if (delta === 0) continue

    lines.push({
      entryId: entry.id,
      previousAmountDue: previousDue,
      newAmountDue: newDue,
      amountPaid,
      delta,
    })
  }

  return lines
}

export function summarizeFeeAdjustments(lines: FeeAdjustmentLine[]): {
  entriesWithPaymentsCount: number
  totalRefundDue: number
  totalCollectDue: number
} {
  let totalRefundDue = 0
  let totalCollectDue = 0

  for (const line of lines) {
    if (line.delta < 0) {
      totalRefundDue += Math.abs(line.delta)
    } else if (line.delta > 0) {
      totalCollectDue += line.delta
    }
  }

  return {
    entriesWithPaymentsCount: lines.length,
    totalRefundDue: roundMoney(totalRefundDue),
    totalCollectDue: roundMoney(totalCollectDue),
  }
}
