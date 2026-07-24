'use server'

import { revalidatePath } from 'next/cache'

import {
  addPalitadaContributionSchema,
  cancelMatchSchema,
  completeMatchSettlementSchema,
  createMatchSchema,
  deletePalitadaContributionSchema,
  lockMatchListSchema,
  lookupRoosterForMatchingSchema,
  markVipSettlementPaidSchema,
  postMatchSettlementObligationSchema,
  updateFightQueueStatusSchema,
  updateMatchBetAmountsSchema,
} from '@/features/matches/schema'
import {
  cancelUnpaidMatch,
  createMatch,
  lockMatchList,
  lookupEligibleRoosterByBarcode,
  updateFightQueueStatus,
  updateMatchBetAmounts,
} from '@/features/matches/service'
import {
  addPalitadaContribution,
  deletePalitadaContribution,
} from '@/features/matches/palitada-service'
import {
  completeMatchSettlement,
  markVipSettlementObligationPaid,
  postMatchSettlementObligation,
} from '@/features/matches/match-settling-service'
import {
  requireMatchSettleManage,
  requirePalitadaManage,
  requirePermission,
} from '@/lib/auth/permissions'

export type MatchActionState = {
  error?: string
  success?: string
  matchId?: string
  contributionId?: string
}

export async function createMatchAction(
  _prev: MatchActionState,
  formData: FormData
): Promise<MatchActionState> {
  const profile = await requirePermission('matches.manage')

  const parsed = createMatchSchema.safeParse({
    eventId: formData.get('eventId'),
    meronEntryId: formData.get('meronEntryId'),
    meronRoosterId: formData.get('meronRoosterId'),
    walaEntryId: formData.get('walaEntryId'),
    walaRoosterId: formData.get('walaRoosterId'),
    fightNumber: formData.get('fightNumber')?.toString().trim() || undefined,
    roundNumber: formData.get('roundNumber')?.toString().trim() || undefined,
    meronBet: formData.get('meronBet')?.toString().trim() || undefined,
    walaBet: formData.get('walaBet')?.toString().trim() || undefined,
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }

  const result = await createMatch(profile.id, parsed.data)
  if (result.error) return { error: result.error }

  revalidatePath(`/dashboard/events/${parsed.data.eventId}/matching`)
  revalidatePath('/dashboard/fights')
  return {
    success: 'Match created — print pledge slips for both sides',
    matchId: result.matchId,
  }
}

export async function lookupRoosterForMatchingAction(
  eventId: string,
  barcode: string
): Promise<{ error?: string; rooster?: Awaited<ReturnType<typeof lookupEligibleRoosterByBarcode>>['rooster'] }> {
  await requirePermission('matches.manage')

  const parsed = lookupRoosterForMatchingSchema.safeParse({ eventId, barcode })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid barcode' }
  }

  return lookupEligibleRoosterByBarcode(parsed.data)
}

export async function cancelMatchAction(
  _prev: MatchActionState,
  formData: FormData
): Promise<MatchActionState> {
  const profile = await requirePermission('matches.manage')

  const parsed = cancelMatchSchema.safeParse({
    eventId: formData.get('eventId'),
    matchId: formData.get('matchId'),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }

  const result = await cancelUnpaidMatch(profile.id, parsed.data)
  if (result.error) return { error: result.error }

  revalidatePath(`/dashboard/events/${parsed.data.eventId}/matching`)
  revalidatePath('/dashboard/fights')
  return { success: 'Match cancelled' }
}

export async function lockMatchListAction(
  _prev: MatchActionState,
  formData: FormData
): Promise<MatchActionState> {
  const profile = await requirePermission('matches.manage')

  const parsed = lockMatchListSchema.safeParse({
    eventId: formData.get('eventId'),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }

  const result = await lockMatchList(profile.id, parsed.data)
  if (result.error) return { error: result.error }

  revalidatePath(`/dashboard/events/${parsed.data.eventId}/matching`)
  revalidatePath('/dashboard/fights')
  revalidatePath('/dashboard/audit')
  return { success: `Locked ${result.lockedCount ?? 0} match(es) for the fight queue` }
}

export async function updateFightQueueStatusAction(
  _prev: MatchActionState,
  formData: FormData
): Promise<MatchActionState> {
  const profile = await requirePermission('matches.manage')

  const parsed = updateFightQueueStatusSchema.safeParse({
    matchId: formData.get('matchId'),
    queueStatus: formData.get('queueStatus'),
    direction: formData.get('direction')?.toString() || 'advance',
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }

  const result = await updateFightQueueStatus(profile.id, parsed.data)
  if (result.error) return { error: result.error }

  const eventId = formData.get('eventId')?.toString()
  if (eventId) {
    revalidatePath(`/dashboard/events/${eventId}/matching`)
  revalidatePath(`/dashboard/events/${eventId}/matching/pit`)
  }
  revalidatePath('/dashboard/fights')
  revalidatePath('/dashboard/audit')
  return { success: 'Fight queue updated' }
}

export async function updateMatchBetAmountsAction(
  _prev: MatchActionState,
  formData: FormData
): Promise<MatchActionState> {
  const profile = await requirePermission('matches.manage')

  const parsed = updateMatchBetAmountsSchema.safeParse({
    eventId: formData.get('eventId'),
    matchId: formData.get('matchId'),
    meronBet: formData.get('meronBet')?.toString().trim() || undefined,
    walaBet: formData.get('walaBet')?.toString().trim() || undefined,
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }

  const result = await updateMatchBetAmounts(profile.id, parsed.data)
  if (result.error) return { error: result.error }

  revalidatePath(`/dashboard/events/${parsed.data.eventId}/matching`)
  revalidatePath(`/dashboard/events/${parsed.data.eventId}/payments`)
  revalidatePath('/dashboard/fights')
  revalidatePath('/dashboard/audit')
  return { success: 'Pledge amounts updated — settle adjustments at Cashier Terminal if due' }
}

export async function addPalitadaContributionAction(
  _prev: MatchActionState,
  formData: FormData
): Promise<MatchActionState> {
  const profile = await requirePalitadaManage()

  const parsed = addPalitadaContributionSchema.safeParse({
    eventId: formData.get('eventId'),
    matchId: formData.get('matchId'),
    side: formData.get('side'),
    contributorName: formData.get('contributorName'),
    contributorType: formData.get('contributorType') ?? 'vip',
    amount: formData.get('amount')?.toString().trim() || undefined,
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }

  const result = await addPalitadaContribution(profile.id, parsed.data)
  if (result.error) return { error: result.error }

  revalidatePath(`/dashboard/events/${parsed.data.eventId}/matching/pit`)
  revalidatePath('/dashboard/fights')
  revalidatePath('/dashboard/audit')
  return { success: 'Palitada recorded' }
}

export async function deletePalitadaContributionAction(
  _prev: MatchActionState,
  formData: FormData
): Promise<MatchActionState> {
  const profile = await requirePalitadaManage()

  const parsed = deletePalitadaContributionSchema.safeParse({
    eventId: formData.get('eventId'),
    matchId: formData.get('matchId'),
    contributionId: formData.get('contributionId'),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }

  const result = await deletePalitadaContribution(profile.id, parsed.data)
  if (result.error) return { error: result.error }

  revalidatePath(`/dashboard/events/${parsed.data.eventId}/matching/pit`)
  revalidatePath('/dashboard/fights')
  revalidatePath('/dashboard/audit')
  return { success: 'Palitada removed', contributionId: parsed.data.contributionId }
}

export async function postMatchSettlementObligationAction(
  _prev: MatchActionState,
  formData: FormData
): Promise<MatchActionState> {
  const profile = await requireMatchSettleManage()

  const parsed = postMatchSettlementObligationSchema.safeParse({
    eventId: formData.get('eventId'),
    matchId: formData.get('matchId'),
    obligationId: formData.get('obligationId'),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }

  const result = await postMatchSettlementObligation(
    profile.id,
    parsed.data.eventId,
    parsed.data.matchId,
    parsed.data.obligationId
  )
  if (result.error) return { error: result.error }

  revalidatePath(`/dashboard/events/${parsed.data.eventId}/matching`)
  revalidatePath(`/dashboard/events/${parsed.data.eventId}/revolving-fund`)
  revalidatePath(`/dashboard/events/${parsed.data.eventId}/results`)
  return { success: 'Obligation posted to revolving fund' }
}

export async function markVipSettlementPaidAction(
  _prev: MatchActionState,
  formData: FormData
): Promise<MatchActionState> {
  const profile = await requireMatchSettleManage()

  const parsed = markVipSettlementPaidSchema.safeParse({
    eventId: formData.get('eventId'),
    matchId: formData.get('matchId'),
    obligationId: formData.get('obligationId'),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }

  const result = await markVipSettlementObligationPaid(
    profile.id,
    parsed.data.eventId,
    parsed.data.matchId,
    parsed.data.obligationId
  )
  if (result.error) return { error: result.error }

  revalidatePath(`/dashboard/events/${parsed.data.eventId}/matching`)
  revalidatePath(`/dashboard/events/${parsed.data.eventId}/results`)
  return { success: 'VIP payment marked complete' }
}

export async function completeMatchSettlementAction(
  _prev: MatchActionState,
  formData: FormData
): Promise<MatchActionState> {
  const profile = await requireMatchSettleManage()

  const parsed = completeMatchSettlementSchema.safeParse({
    eventId: formData.get('eventId'),
    matchId: formData.get('matchId'),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }

  const result = await completeMatchSettlement(
    profile.id,
    parsed.data.eventId,
    parsed.data.matchId
  )
  if (result.error) return { error: result.error }

  revalidatePath(`/dashboard/events/${parsed.data.eventId}/matching`)
  revalidatePath(`/dashboard/events/${parsed.data.eventId}/results`)
  revalidatePath('/dashboard/fights')
  return { success: 'Match marked settled' }
}
