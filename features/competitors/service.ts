import 'server-only'

import { writeAuditLog } from '@/features/audit/service'
import {
  countEntriesForCompetitor,
  findCompetitorByDisplayName,
} from '@/features/competitors/queries'
import type {
  CreateCompetitorInput,
  DeleteCompetitorInput,
  UpdateCompetitorInput,
} from '@/features/competitors/schema'
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
      contact_full_name: input.contactFullName ?? null,
      contact_designation: input.contactDesignation ?? null,
      contact_number: input.contactNumber ?? null,
      email: input.email ?? null,
      address: input.address ?? null,
      notes: input.notes ?? null,
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

export async function updateCompetitor(
  actorId: string,
  input: UpdateCompetitorInput
): Promise<{ error?: string }> {
  const supabase = await createExtendedClient()

  const { data, error } = await supabase
    .from('competitors')
    .update({
      display_name: input.displayName.trim(),
      contact_full_name: input.contactFullName ?? null,
      contact_designation: input.contactDesignation ?? null,
      contact_number: input.contactNumber ?? null,
      email: input.email ?? null,
      address: input.address ?? null,
      notes: input.notes ?? null,
      updated_by: actorId,
    })
    .eq('id', input.id)
    .is('deleted_at', null)
    .select('id, display_name')
    .maybeSingle()

  if (error) return { error: error.message }
  if (!data) return { error: 'Owner not found' }

  await writeAuditLog({
    actorId,
    action: 'competitor.updated',
    entityType: 'competitor',
    entityId: data.id,
    newValues: {
      display_name: data.display_name,
    },
  })

  return {}
}

export async function softDeleteCompetitor(
  actorId: string,
  input: DeleteCompetitorInput
): Promise<{ error?: string }> {
  const linkedEntries = await countEntriesForCompetitor(input.id)
  if (linkedEntries > 0) {
    return {
      error: `Cannot delete this owner because ${linkedEntries} event ${linkedEntries === 1 ? 'entry is' : 'entries are'} still linked.`,
    }
  }

  const supabase = await createExtendedClient()
  const deletedAt = new Date().toISOString()

  const { data, error } = await supabase
    .from('competitors')
    .update({
      deleted_at: deletedAt,
      updated_by: actorId,
    })
    .eq('id', input.id)
    .is('deleted_at', null)
    .select('id, display_name')
    .maybeSingle()

  if (error) return { error: error.message }
  if (!data) return { error: 'Owner not found' }

  await writeAuditLog({
    actorId,
    action: 'competitor.deleted',
    entityType: 'competitor',
    entityId: data.id,
    oldValues: {
      display_name: data.display_name,
    },
  })

  return {}
}
