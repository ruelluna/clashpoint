import 'server-only'

import { writeAuditLog } from '@/features/audit/service'
import { canSubmitLineup } from '@/features/entries/service'
import { getEntry } from '@/features/entries/queries'
import { getEvent } from '@/features/events/queries'
import type { SubmitLineupInput } from '@/features/lineups/schema'
import { validateCockCount } from '@/features/lineups/schema'
import { createClient } from '@/lib/supabase/server'

export async function submitLineup(
  actorId: string,
  input: SubmitLineupInput
): Promise<{ error?: string }> {
  const entry = await getEntry(input.entryId)
  if (!entry) return { error: 'Entry not found' }
  if (entry.event_id !== input.eventId) {
    return { error: 'Entry does not belong to this event' }
  }
  if (!canSubmitLineup(entry)) {
    return {
      error: 'Only fully paid entries can submit a lineup',
    }
  }

  const event = await getEvent(input.eventId)
  if (!event) return { error: 'Event not found' }

  const countError = validateCockCount(input.cocks.length, event.cocks_per_entry)
  if (countError) return { error: countError }

  const supabase = await createClient()

  const submittedBands = input.cocks.map((cock) => cock.bandNumber.trim())
  const { data: existingBands, error: bandError } = await supabase
    .from('rooster_records')
    .select('band_number, entry_id')
    .eq('event_id', input.eventId)
    .neq('entry_id', input.entryId)

  if (bandError) return { error: bandError.message }

  const takenBands = new Set(
    (existingBands ?? []).map((row) =>
      (row.band_number as string).trim().toLowerCase()
    )
  )

  for (const band of submittedBands) {
    if (takenBands.has(band.toLowerCase())) {
      return { error: `Band number ${band} is already registered for this event` }
    }
  }

  const { error: deleteError } = await supabase
    .from('rooster_records')
    .delete()
    .eq('entry_id', input.entryId)

  if (deleteError) return { error: deleteError.message }

  const rows = input.cocks.map((cock) => ({
    entry_id: input.entryId,
    event_id: input.eventId,
    cock_number: cock.cockNumber,
    band_number: cock.bandNumber.trim(),
    declared_weight: cock.declaredWeight ?? null,
    category: cock.category ?? null,
    color_marking: cock.colorMarking ?? null,
    status: 'submitted' as const,
  }))

  const { data: inserted, error: insertError } = await supabase
    .from('rooster_records')
    .insert(rows)
    .select('id')

  if (insertError) return { error: insertError.message }

  await writeAuditLog({
    actorId,
    action: 'lineup.submitted',
    entityType: 'entry',
    entityId: input.entryId,
    newValues: {
      event_id: input.eventId,
      entry_number: entry.entry_number,
      cock_count: rows.length,
      rooster_ids: (inserted ?? []).map((row) => row.id),
    },
  })

  return {}
}
