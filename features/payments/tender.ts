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

export type SplitTenderRow = {
  amountTendered: number | null
  changeGiven: number | null
}

/** Distributes cash tender/change across split payment rows so each satisfies payments_tender_change_check. */
export function allocateSplitPaymentTender(
  portionAmounts: number[],
  amountTendered: number | undefined,
  changeGiven: number | undefined
): SplitTenderRow[] {
  if (
    portionAmounts.length === 0 ||
    amountTendered == null ||
    changeGiven == null
  ) {
    return portionAmounts.map(() => ({
      amountTendered: null,
      changeGiven: null,
    }))
  }

  const lastIndex = portionAmounts.length - 1
  return portionAmounts.map((portionAmount, index) => {
    if (index < lastIndex) {
      return {
        amountTendered: roundMoney(portionAmount),
        changeGiven: 0,
      }
    }
    return {
      amountTendered: roundMoney(portionAmount + changeGiven),
      changeGiven: roundMoney(changeGiven),
    }
  })
}

export const CASH_DENOMINATIONS = [100, 500, 1000] as const
