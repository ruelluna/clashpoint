'use server'

import { revalidatePath } from 'next/cache'

import {
  cancelMatchSchema,
  createMatchSchema,
  lockMatchListSchema,
  lookupRoosterForMatchingSchema,
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
import { requirePermission } from '@/lib/auth/permissions'

export type MatchActionState = { error?: string; success?: string; matchId?: string }

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
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }

  const result = await updateFightQueueStatus(profile.id, parsed.data)
  if (result.error) return { error: result.error }

  const eventId = formData.get('eventId')?.toString()
  if (eventId) {
    revalidatePath(`/dashboard/events/${eventId}/matching`)
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
