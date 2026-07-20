import { roundMatchMoney } from '@/features/matches/utils'

export type BetBalancingInput = {
  meronBase: number
  walaBase: number
  meronPalitada?: number
  walaPalitada?: number
  commissionRatePercent: number
  taxPerFight: number
}

export type BetBalancingSide = 'meron' | 'wala'

export type BetBalancingSnapshot = {
  meronBase: number
  walaBase: number
  meronPalitada: number
  walaPalitada: number
  meronTotal: number
  walaTotal: number
  totalPledges: number
  imbalance: number
  imbalanceSide: BetBalancingSide | null
  isBalanced: boolean
  commissionRatePercent: number
  totalCommission: number
  taxPerFight: number
  netPool: number
  meronOdds: number
  walaOdds: number
  meronWinningsPotential: number
  walaWinningsPotential: number
}

function roundOdds(value: number): number {
  return Math.round(value * 100) / 100
}

export function computeBetBalancing(input: BetBalancingInput): BetBalancingSnapshot {
  const meronPalitada = input.meronPalitada ?? 0
  const walaPalitada = input.walaPalitada ?? 0
  const meronTotal = roundMatchMoney(input.meronBase + meronPalitada)
  const walaTotal = roundMatchMoney(input.walaBase + walaPalitada)
  const totalPledges = roundMatchMoney(meronTotal + walaTotal)
  const imbalance = roundMatchMoney(Math.abs(meronTotal - walaTotal))

  let imbalanceSide: BetBalancingSide | null = null
  if (meronTotal < walaTotal) imbalanceSide = 'meron'
  else if (walaTotal < meronTotal) imbalanceSide = 'wala'

  const totalCommission = roundMatchMoney(
    (totalPledges * Math.max(0, input.commissionRatePercent)) / 100
  )
  const taxPerFight = roundMatchMoney(Math.max(0, input.taxPerFight))
  const netPool = roundMatchMoney(totalPledges - totalCommission - taxPerFight)

  const meronOdds = meronTotal > 0 ? roundOdds(netPool / meronTotal) : 0
  const walaOdds = walaTotal > 0 ? roundOdds(netPool / walaTotal) : 0

  return {
    meronBase: roundMatchMoney(input.meronBase),
    walaBase: roundMatchMoney(input.walaBase),
    meronPalitada: roundMatchMoney(meronPalitada),
    walaPalitada: roundMatchMoney(walaPalitada),
    meronTotal,
    walaTotal,
    totalPledges,
    imbalance,
    imbalanceSide,
    isBalanced: imbalance < 0.005,
    commissionRatePercent: input.commissionRatePercent,
    totalCommission,
    taxPerFight,
    netPool,
    meronOdds,
    walaOdds,
    meronWinningsPotential: netPool,
    walaWinningsPotential: netPool,
  }
}

export function getPledgeBaseAmount(
  agreedAmount: number,
  collectedAmount: number,
  paymentStatus: 'unpaid' | 'paid' | 'refunded' | 'waived'
): number {
  if (paymentStatus === 'paid') return roundMatchMoney(collectedAmount)
  return roundMatchMoney(agreedAmount)
}
