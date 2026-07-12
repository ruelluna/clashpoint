import 'server-only'

import { writeAuditLog } from '@/features/audit/service'
import { findCompetitorByDisplayName } from '@/features/competitors/queries'
import type { CreateCompetitorInput } from '@/features/competitors/schema'
import { createExtendedClient } from '@/lib/supabase/extended'

export async function createCompetitor(
  actorId: string,
  input: CreateCompetitorInput
): Promise<{ error?: string; competitorId?: string }> {
  const supabase = await createExtendedClient()

  const { data, error } = await supabase
    .from('competitors')
    .insert({
      display_name: input.displayName.trim(),
      contact_number: input.contactNumber ?? null,
      email: input.email ?? null,
      address: input.address ?? null,
      created_by: actorId,
      updated_by: actorId,
    })
    .select('id, display_name')
    .single()

  if (error || !data) {
    return { error: error?.message ?? 'Failed to create competitor' }
  }

  await writeAuditLog({
    actorId,
    action: 'competitor.created',
    entityType: 'competitor',
    entityId: data.id,
    newValues: {
      display_name: data.display_name,
    },
  })

  return { competitorId: data.id }
}

export async function findOrCreateCompetitor(
  actorId: string,
  input: CreateCompetitorInput
): Promise<{ error?: string; competitorId?: string }> {
  const existing = await findCompetitorByDisplayName(input.displayName)
  if (existing) {
    return { competitorId: existing.id }
  }

  return createCompetitor(actorId, input)
}
