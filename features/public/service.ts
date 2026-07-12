import 'server-only'

import { createEntryWithRoosters } from '@/features/entries/service'
import type { CreatePublicEntryInput } from '@/features/public/schema'
import { getPublicRegistrationEvent } from '@/features/public/queries'
import { createAdminClient } from '@/lib/supabase/admin'

const ADMIN_WRITE = { useAdminClient: true } as const

export async function createPublicEntryWithRoosters(
  input: CreatePublicEntryInput
): Promise<{
  error?: string
  entryId?: string
  entryNumber?: string
}> {
  const event = await getPublicRegistrationEvent(input.eventId)
  if (!event) {
    return { error: 'Event not found' }
  }

  if (event.event_type !== 'derby') {
    return { error: 'Online registration is only available for derby events' }
  }

  const result = await createEntryWithRoosters(null, input, ADMIN_WRITE)
  if (result.error || !result.entryId) {
    return { error: result.error ?? 'Failed to register entry' }
  }

  const supabase = createAdminClient()
  const { data: entry, error } = await supabase
    .from('entries')
    .select('entry_number')
    .eq('id', result.entryId)
    .maybeSingle()

  if (error) return { error: error.message }

  return {
    entryId: result.entryId,
    entryNumber: (entry?.entry_number as string | undefined) ?? undefined,
  }
}
