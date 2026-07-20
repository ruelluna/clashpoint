'use server'

import { revalidatePath } from 'next/cache'

import {
  recordResultSchema,
  verifyResultSchema,
} from '@/features/results/schema'
import { recordResult, verifyResult } from '@/features/results/service'
import { requirePermission } from '@/lib/auth/permissions'

export type ResultActionState = { error?: string; success?: string }

export async function recordResultAction(
  _prev: ResultActionState,
  formData: FormData
): Promise<ResultActionState> {
  const profile = await requirePermission('results.manage')

  const parsed = recordResultSchema.safeParse({
    matchId: formData.get('matchId'),
    eventId: formData.get('eventId'),
    resultType: formData.get('resultType'),
    notes: formData.get('notes')?.toString() ?? '',
    underProtest: formData.get('underProtest') === 'on',
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }

  const result = await recordResult(profile.id, parsed.data)
  if (result.error) return { error: result.error }

  revalidatePath(`/dashboard/events/${parsed.data.eventId}/results`)
  revalidatePath(`/dashboard/events/${parsed.data.eventId}/matching`)
  revalidatePath(`/dashboard/events/${parsed.data.eventId}/standings`)
  return { success: 'Result recorded and submitted for verification' }
}

export async function verifyResultAction(
  _prev: ResultActionState,
  formData: FormData
): Promise<ResultActionState> {
  const profile = await requirePermission('results.manage')

  const parsed = verifyResultSchema.safeParse({
    resultId: formData.get('resultId'),
    eventId: formData.get('eventId'),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }

  const result = await verifyResult(profile.id, parsed.data)
  if (result.error) return { error: result.error }

  revalidatePath(`/dashboard/events/${parsed.data.eventId}/results`)
  revalidatePath(`/dashboard/events/${parsed.data.eventId}/standings`)
  revalidatePath('/dashboard/audit')
  return { success: 'Result verified and standings updated' }
}
