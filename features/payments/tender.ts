export function roundMoney(value: number): number {
  return Number(value.toFixed(2))
}

export type CashChangeResult =
  | { ok: true; changeGiven: number }
  | { ok: false; error: string }

export function computeCashChange(
  amountCollected: number,
  amountTendered: number
): CashChangeResult {
  const collected = roundMoney(amountCollected)
  const tendered = roundMoney(amountTendered)

  if (tendered < collected) {
    return {
      ok: false,
      error: 'Cash tendered must be at least the amount to collect',
    }
  }

  return { ok: true, changeGiven: roundMoney(tendered - collected) }
}

export const CASH_DENOMINATIONS = [100, 500, 1000] as const

export function clearedTenderFieldsForRefund() {
  return { amount_tendered: null, change_given: null } as const
}
