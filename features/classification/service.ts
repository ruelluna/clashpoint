import 'server-only'

import { writeAuditLog } from '@/features/audit/service'
import {
  normalizePairingValues,
  type AssignCompetitorLevelInput,
  type AssignEntryDivisionInput,
  type AssignRoosterClassInput,
  type GetPairingStatusInput,
  type UpsertPairingRulesInput,
} from '@/features/classification/schema'
import type { PairingStatus } from '@/lib/derby/enums'
import { createExtendedClient } from '@/lib/supabase/extended'

async function insertClassificationHistory(input: {
  entityType: string
  entityId: string
  classificationField: string
  previousValue: string | null
  newValue: string
  notes?: string
  assignedBy: string
  eventId?: string
}): Promise<void> {
  const supabase = await createExtendedClient()
  await supabase.from('rooster_classification_history').insert({
    entity_type: input.entityType,
    entity_id: input.entityId,
    classification_field: input.classificationField,
    previous_value: input.previousValue,
    new_value: input.newValue,
    notes: input.notes ?? null,
    assigned_by: input.assignedBy,
    event_id: input.eventId ?? null,
  })
}

export async function assignRoosterClass(
  actorId: string,
  input: AssignRoosterClassInput
): Promise<{ error?: string }> {
  const supabase = await createExtendedClient()

  const { data: existing, error: fetchError } = await supabase
    .from('roosters')
    .select('id, rooster_code, competition_class')
    .eq('id', input.roosterId)
    .is('deleted_at', null)
    .maybeSingle()

  if (fetchError) return { error: fetchError.message }
  if (!existing) return { error: 'Rooster not found' }

  const { error } = await supabase
    .from('roosters')
    .update({
      competition_class: input.competitionClass,
      competition_class_assigned_by: actorId,
      competition_class_assigned_at: new Date().toISOString(),
      competition_class_notes: input.notes ?? null,
      updated_by: actorId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', input.roosterId)

  if (error) return { error: error.message }

  await insertClassificationHistory({
    entityType: 'rooster',
    entityId: input.roosterId,
    classificationField: 'competition_class',
    previousValue: existing.competition_class,
    newValue: input.competitionClass,
    notes: input.notes,
    assignedBy: actorId,
    eventId: input.eventId,
  })

  await writeAuditLog({
    actorId,
    action: 'classification.rooster_class_assigned',
    entityType: 'rooster',
    entityId: input.roosterId,
    newValues: {
      event_id: input.eventId,
      rooster_code: existing.rooster_code,
      competition_class: input.competitionClass,
    },
  })

  return {}
}

export async function assignCompetitorLevel(
  actorId: string,
  input: AssignCompetitorLevelInput
): Promise<{ error?: string }> {
  const supabase = await createExtendedClient()

  const { data: existing, error: fetchError } = await supabase
    .from('competitors')
    .select('id, display_name, competitor_level')
    .eq('id', input.competitorId)
    .is('deleted_at', null)
    .maybeSingle()

  if (fetchError) return { error: fetchError.message }
  if (!existing) return { error: 'Competitor not found' }

  const { error } = await supabase
    .from('competitors')
    .update({
      competitor_level: input.competitorLevel,
      competitor_level_assigned_by: actorId,
      competitor_level_assigned_at: new Date().toISOString(),
      competitor_level_notes: input.notes ?? null,
      updated_by: actorId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', input.competitorId)

  if (error) return { error: error.message }

  await insertClassificationHistory({
    entityType: 'competitor',
    entityId: input.competitorId,
    classificationField: 'competitor_level',
    previousValue: existing.competitor_level,
    newValue: input.competitorLevel,
    notes: input.notes,
    assignedBy: actorId,
    eventId: input.eventId,
  })

  await writeAuditLog({
    actorId,
    action: 'classification.competitor_level_assigned',
    entityType: 'competitor',
    entityId: input.competitorId,
    newValues: {
      event_id: input.eventId ?? null,
      display_name: existing.display_name,
      competitor_level: input.competitorLevel,
    },
  })

  return {}
}

export async function assignEntryDivision(
  actorId: string,
  input: AssignEntryDivisionInput
): Promise<{ error?: string }> {
  const supabase = await createExtendedClient()

  const { data: existing, error: fetchError } = await supabase
    .from('entries')
    .select('id, event_id, entry_number, entry_division')
    .eq('id', input.entryId)
    .eq('event_id', input.eventId)
    .is('deleted_at', null)
    .maybeSingle()

  if (fetchError) return { error: fetchError.message }
  if (!existing) return { error: 'Entry not found for this event' }

  const { error } = await supabase
    .from('entries')
    .update({
      entry_division: input.entryDivision,
      entry_division_assigned_by: actorId,
      entry_division_assigned_at: new Date().toISOString(),
      entry_division_notes: input.notes ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', input.entryId)

  if (error) return { error: error.message }

  await insertClassificationHistory({
    entityType: 'entry',
    entityId: input.entryId,
    classificationField: 'entry_division',
    previousValue: existing.entry_division,
    newValue: input.entryDivision,
    notes: input.notes,
    assignedBy: actorId,
    eventId: input.eventId,
  })

  await writeAuditLog({
    actorId,
    action: 'classification.entry_division_assigned',
    entityType: 'entry',
    entityId: input.entryId,
    newValues: {
      event_id: input.eventId,
      entry_number: existing.entry_number,
      entry_division: input.entryDivision,
    },
  })

  return {}
}

export async function getPairingStatus(
  input: GetPairingStatusInput
): Promise<PairingStatus> {
  const supabase = await createExtendedClient()
  const [firstValue, secondValue] = normalizePairingValues(
    input.firstValue,
    input.secondValue
  )

  const { data, error } = await supabase
    .from('event_pairing_rules')
    .select('pairing_status')
    .eq('event_id', input.eventId)
    .eq('classification_type', input.classificationType)
    .eq('first_value', firstValue)
    .eq('second_value', secondValue)
    .maybeSingle()

  if (error) throw error
  if (data?.pairing_status) {
    return data.pairing_status as PairingStatus
  }

  const { data: reverseRule } = await supabase
    .from('event_pairing_rules')
    .select('pairing_status')
    .eq('event_id', input.eventId)
    .eq('classification_type', input.classificationType)
    .eq('first_value', secondValue)
    .eq('second_value', firstValue)
    .maybeSingle()

  if (reverseRule?.pairing_status) {
    return reverseRule.pairing_status as PairingStatus
  }

  return 'allowed'
}

export async function upsertPairingRules(
  actorId: string,
  input: UpsertPairingRulesInput
): Promise<{ error?: string; upsertedCount?: number }> {
  const supabase = await createExtendedClient()
  const rows = input.rules.map((rule) => {
    const [firstValue, secondValue] = normalizePairingValues(
      rule.firstValue,
      rule.secondValue
    )

    return {
      event_id: input.eventId,
      classification_type: rule.classificationType,
      first_value: firstValue,
      second_value: secondValue,
      pairing_status: rule.pairingStatus,
      notes: rule.notes ?? null,
      created_by: actorId,
      updated_by: actorId,
      updated_at: new Date().toISOString(),
    }
  })

  const { error } = await supabase
    .from('event_pairing_rules')
    .upsert(rows, {
      onConflict: 'event_id,classification_type,first_value,second_value',
    })

  if (error) return { error: error.message }

  await writeAuditLog({
    actorId,
    action: 'classification.pairing_rules_upserted',
    entityType: 'event',
    entityId: input.eventId,
    newValues: {
      rule_count: rows.length,
    },
  })

  return { upsertedCount: rows.length }
}
