import { roundMatchMoney } from '@/features/matches/utils'
import type { MatchListItem, PalitadaContributorItem } from '@/features/matches/types'

export type PledgeSettlementSide = 'meron' | 'wala'

export type PalitadaContributorType = 'vip' | 'monton'

export type PalitadaContributorInput = {
  id?: string
  contributorName: string
  contributorType: PalitadaContributorType
  amount: number
}

export type PledgeSettlementInput = {
  meronBasePledge: number
  walaBasePledge: number
  meronPalitadaContributors?: PalitadaContributorInput[]
  walaPalitadaContributors?: PalitadaContributorInput[]
  commissionRatePercent: number
  taxAmount: number
}

export type PalitadaContributorBreakdown = {
  id: string | null
  contributorName: string
  contributorType: PalitadaContributorType
  amount: number
  percentageShare: number
  winnings: number
  drawNetRefund: number
}

export type SideSettlementBreakdown = {
  basePledge: number
  palitadaTotal: number
  sideTotal: number
  commission: number
  tax: number
  sideNet: number
  oddsExact: number
  odds: number
  ownerShare: number
  /** Net handler profit when this side wins (payout minus stake). */
  handlerWinnings: number
  /** Gross handler payout when this side wins (includes returned stake). */
  handlerPayout: number
  /** Handler + Palitada payouts when this side wins (= share of winning pool). */
  sideWinTotal: number
  contributorShare: number
  contributors: PalitadaContributorBreakdown[]
}

export type PledgeSettlementResult = {
  meronBasePledge: number
  walaBasePledge: number
  meronPalitadaTotal: number
  walaPalitadaTotal: number
  meronTotal: number
  walaTotal: number
  totalPool: number
  commissionRate: number
  commissionRatePercentage: number
  taxAmount: number
  meronCommission: number
  walaCommission: number
  meronTax: number
  walaTax: number
  totalCommission: number
  totalTax: number
  meronNet: number
  walaNet: number
  totalWinningPool: number
  meronOdds: number
  walaOdds: number
  imbalance: number
  underdogSide: PledgeSettlementSide | null
  amountNeededToBalance: number
  isBalanced: boolean
  meronOwnerShare: number
  walaOwnerShare: number
  meronContributorShare: number
  walaContributorShare: number
  montonHouseEarnings: number
  meron: SideSettlementBreakdown
  wala: SideSettlementBreakdown
}

const BALANCE_EPSILON = 0.01

function roundOddsDisplay(value: number): number {
  return Math.round(value * 100) / 100
}

function sumPalitadaAmounts(contributors: PalitadaContributorInput[] | undefined): number {
  if (!contributors?.length) return 0
  return roundMatchMoney(
    contributors.reduce((sum, contributor) => sum + Math.max(0, contributor.amount), 0)
  )
}

function computeSideCommission(sideTotal: number, commissionRate: number): number {
  return roundMatchMoney(sideTotal * commissionRate)
}

function computeSideTax(taxAmount: number): number {
  return roundMatchMoney(Math.max(0, taxAmount) / 2)
}

function computeContributorDrawRefund(
  contributionAmount: number,
  sideTotal: number,
  commissionRate: number,
  taxAmount: number
): number {
  const amount = roundMatchMoney(Math.max(0, contributionAmount))
  if (amount <= 0) return 0

  const commissionPart = roundMatchMoney(amount * commissionRate)
  const taxPart =
    sideTotal > 0
      ? roundMatchMoney((amount / sideTotal) * computeSideTax(taxAmount))
      : 0

  return roundMatchMoney(Math.max(0, amount - commissionPart - taxPart))
}

function buildSideBreakdown(
  basePledge: number,
  contributors: PalitadaContributorInput[],
  sideTotal: number,
  commissionRate: number,
  taxAmount: number,
  sideCommission: number,
  sideTax: number,
  sideNet: number,
  totalWinningPool: number
): SideSettlementBreakdown {
  const palitadaTotal = sumPalitadaAmounts(contributors)
  const oddsExact = sideTotal > 0 ? totalWinningPool / sideTotal : 0
  const odds = sideTotal > 0 ? roundOddsDisplay(oddsExact) : 2.0
  const ownerShare =
    sideTotal > 0
      ? roundMatchMoney((basePledge / sideTotal) * totalWinningPool)
      : 0
  const handlerPayout = ownerShare
  const handlerWinnings = roundMatchMoney(Math.max(0, handlerPayout - basePledge))
  const contributorShare = roundMatchMoney(sideNet - ownerShare)

  const contributorRows: PalitadaContributorBreakdown[] = contributors.map(
    (contributor) => {
      const amount = roundMatchMoney(Math.max(0, contributor.amount))
      const percentageShare = sideTotal > 0 ? amount / sideTotal : 0
      const winnings =
        sideTotal > 0
          ? roundMatchMoney(totalWinningPool * percentageShare)
          : 0

      return {
        id: contributor.id ?? null,
        contributorName: contributor.contributorName,
        contributorType: contributor.contributorType,
        amount,
        percentageShare,
        winnings,
        drawNetRefund: computeContributorDrawRefund(
          amount,
          sideTotal,
          commissionRate,
          taxAmount
        ),
      }
    }
  )

  const sideWinTotal = roundMatchMoney(
    handlerPayout + contributorRows.reduce((sum, row) => sum + row.winnings, 0)
  )

  return {
    basePledge,
    palitadaTotal,
    sideTotal,
    commission: sideCommission,
    tax: sideTax,
    sideNet,
    oddsExact,
    odds,
    ownerShare,
    handlerWinnings,
    handlerPayout,
    sideWinTotal,
    contributorShare,
    contributors: contributorRows,
  }
}

export function calculatePledgeSettlement(
  input: PledgeSettlementInput
): PledgeSettlementResult {
  const meronBasePledge = roundMatchMoney(Math.max(0, input.meronBasePledge))
  const walaBasePledge = roundMatchMoney(Math.max(0, input.walaBasePledge))
  const meronContributors = input.meronPalitadaContributors ?? []
  const walaContributors = input.walaPalitadaContributors ?? []
  const meronPalitadaTotal = sumPalitadaAmounts(meronContributors)
  const walaPalitadaTotal = sumPalitadaAmounts(walaContributors)
  const meronTotal = roundMatchMoney(meronBasePledge + meronPalitadaTotal)
  const walaTotal = roundMatchMoney(walaBasePledge + walaPalitadaTotal)
  const totalPool = roundMatchMoney(meronTotal + walaTotal)

  const commissionRatePercentage = Math.max(0, input.commissionRatePercent)
  const commissionRate = commissionRatePercentage / 100
  const taxAmount = roundMatchMoney(Math.max(0, input.taxAmount))

  const meronCommission = computeSideCommission(meronTotal, commissionRate)
  const walaCommission = computeSideCommission(walaTotal, commissionRate)
  const meronTax = computeSideTax(taxAmount)
  const walaTax = computeSideTax(taxAmount)
  const totalCommission = roundMatchMoney(meronCommission + walaCommission)
  const totalTax = roundMatchMoney(meronTax + walaTax)

  const meronNet = roundMatchMoney(meronTotal - meronCommission - meronTax)
  const walaNet = roundMatchMoney(walaTotal - walaCommission - walaTax)
  const totalWinningPool = roundMatchMoney(Math.max(0, meronNet + walaNet))

  const meronOdds = meronTotal > 0 ? roundOddsDisplay(totalWinningPool / meronTotal) : 2.0
  const walaOdds = walaTotal > 0 ? roundOddsDisplay(totalWinningPool / walaTotal) : 2.0

  const imbalance = roundMatchMoney(Math.abs(meronTotal - walaTotal))
  let underdogSide: PledgeSettlementSide | null = null
  if (meronTotal < walaTotal - BALANCE_EPSILON) underdogSide = 'meron'
  else if (walaTotal < meronTotal - BALANCE_EPSILON) underdogSide = 'wala'

  const isBalanced = imbalance < BALANCE_EPSILON
  const amountNeededToBalance = isBalanced ? 0 : imbalance

  const meron = buildSideBreakdown(
    meronBasePledge,
    meronContributors,
    meronTotal,
    commissionRate,
    taxAmount,
    meronCommission,
    meronTax,
    meronNet,
    totalWinningPool
  )
  const wala = buildSideBreakdown(
    walaBasePledge,
    walaContributors,
    walaTotal,
    commissionRate,
    taxAmount,
    walaCommission,
    walaTax,
    walaNet,
    totalWinningPool
  )

  const montonHouseEarnings = roundMatchMoney(totalCommission + totalTax)

  return {
    meronBasePledge,
    walaBasePledge,
    meronPalitadaTotal,
    walaPalitadaTotal,
    meronTotal,
    walaTotal,
    totalPool,
    commissionRate,
    commissionRatePercentage,
    taxAmount,
    meronCommission,
    walaCommission,
    meronTax,
    walaTax,
    totalCommission,
    totalTax,
    meronNet,
    walaNet,
    totalWinningPool,
    meronOdds,
    walaOdds,
    imbalance,
    underdogSide,
    amountNeededToBalance,
    isBalanced,
    meronOwnerShare: meron.ownerShare,
    walaOwnerShare: wala.ownerShare,
    meronContributorShare: meron.contributorShare,
    walaContributorShare: wala.contributorShare,
    montonHouseEarnings,
    meron,
    wala,
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

export type ValidatePalitadaContributionInput = {
  settlement: PledgeSettlementResult
  side: PledgeSettlementSide
  amount: number
  existingSideTotal?: number
}

export function validatePalitadaContribution(
  input: ValidatePalitadaContributionInput
): string | null {
  const { settlement, side, amount } = input
  const normalizedAmount = roundMatchMoney(amount)

  if (normalizedAmount <= 0) {
    return 'Palitada amount must be greater than zero'
  }

  if (settlement.isBalanced) {
    return 'Sides are already balanced; Palitada is not needed'
  }

  if (settlement.underdogSide !== side) {
    return 'Palitada may only be recorded on the underdog side'
  }

  const currentPalitadaTotal =
    side === 'meron' ? settlement.meronPalitadaTotal : settlement.walaPalitadaTotal
  const nextSidePalitadaTotal = roundMatchMoney(currentPalitadaTotal + normalizedAmount)

  if (nextSidePalitadaTotal - settlement.amountNeededToBalance > BALANCE_EPSILON) {
    return `Palitada cannot exceed ${settlement.amountNeededToBalance.toFixed(2)} needed to balance`
  }

  return null
}

export function mapPalitadaContributors(
  contributors: PalitadaContributorItem[]
): PalitadaContributorInput[] {
  return contributors.map((contributor) => ({
    id: contributor.id,
    contributorName: contributor.contributor_name,
    contributorType: contributor.contributor_type,
    amount: contributor.amount,
  }))
}

export function buildPledgeSettlementInput(params: {
  match: MatchListItem
  commissionRatePercent: number
  taxAmount: number
}): PledgeSettlementInput {
  const { match, commissionRatePercent, taxAmount } = params

  return {
    meronBasePledge: getPledgeBaseAmount(
      match.meron.bet_amount,
      match.meron.bet_collected_amount,
      match.meron.bet_payment_status
    ),
    walaBasePledge: getPledgeBaseAmount(
      match.wala.bet_amount,
      match.wala.bet_collected_amount,
      match.wala.bet_payment_status
    ),
    meronPalitadaContributors: mapPalitadaContributors(match.meron_palitada),
    walaPalitadaContributors: mapPalitadaContributors(match.wala_palitada),
    commissionRatePercent,
    taxAmount,
  }
}
