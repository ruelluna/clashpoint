'use server'

import { revalidatePath } from 'next/cache'

import {
  createMatchSchema,
  lockMatchListSchema,
  updateFightQueueStatusSchema,
} from '@/features/matches/schema'
import {
  createMatch,
  lockMatchList,
  updateFightQueueStatus,
} from '@/features/matches/service'
import { requirePermission } from '@/lib/auth/permissions'

export type MatchActionState = { error?: string; success?: string }

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
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }

  const result = await createMatch(profile.id, parsed.data)
  if (result.error) return { error: result.error }

  revalidatePath(`/dashboard/events/${parsed.data.eventId}/matching`)
  revalidatePath(`/dashboard/events/${parsed.data.eventId}/fight-queue`)
  revalidatePath('/dashboard/fights')
  return { success: 'Match created' }
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
  revalidatePath(`/dashboard/events/${parsed.data.eventId}/fight-queue`)
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
    revalidatePath(`/dashboard/events/${eventId}/fight-queue`)
    revalidatePath(`/dashboard/events/${eventId}/matching`)
  }
  revalidatePath('/dashboard/fights')
  revalidatePath('/dashboard/audit')
  return { success: 'Fight queue updated' }
}
