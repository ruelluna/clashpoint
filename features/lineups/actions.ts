'use server'

import { revalidatePath } from 'next/cache'

import { submitLineupSchema } from '@/features/lineups/schema'
import { submitLineup } from '@/features/lineups/service'
import { requirePermission } from '@/lib/auth/permissions'

export type LineupActionState = { error?: string; success?: string }

function parseCocksFromForm(formData: FormData, cockCount: number) {
  const cocks = []

  for (let index = 1; index <= cockCount; index += 1) {
    const declaredRaw = formData.get(`declaredWeight_${index}`)?.toString().trim()
    cocks.push({
      cockNumber: index,
      bandNumber: formData.get(`bandNumber_${index}`),
      declaredWeight: declaredRaw ? Number(declaredRaw) : undefined,
      category: formData.get(`category_${index}`)?.toString().trim() || undefined,
      colorMarking:
        formData.get(`colorMarking_${index}`)?.toString().trim() || undefined,
    })
  }

  return cocks
}

export async function submitLineupAction(
  _prev: LineupActionState,
  formData: FormData
): Promise<LineupActionState> {
  const profile = await requirePermission('lineups.manage')

  const cockCount = Number(formData.get('cockCount') ?? 0)
  const parsed = submitLineupSchema.safeParse({
    eventId: formData.get('eventId'),
    entryId: formData.get('entryId'),
    cocks: parseCocksFromForm(formData, cockCount),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid lineup' }
  }

  const result = await submitLineup(profile.id, parsed.data)
  if (result.error) return { error: result.error }

  const eventId = parsed.data.eventId
  revalidatePath(`/dashboard/events/${eventId}/rooster-entries`)
  revalidatePath(`/dashboard/events/${eventId}`)
  revalidatePath('/dashboard/audit')

  return { success: 'Lineup submitted' }
}
