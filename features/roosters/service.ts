import 'server-only'

import { writeAuditLog } from '@/features/audit/service'
import { calculateExperienceFromFights } from '@/features/roosters/experience'
import { listRoosterCodes } from '@/features/roosters/queries'
import {
  formatRoosterCode,
  parseRoosterCodeSequence,
  type CreateRoosterInput,
  type UpdateRoosterInput,
} from '@/features/roosters/schema'
import { catalogReferenceValues } from '@/features/reference-values/service'
import { createExtendedClient } from '@/lib/supabase/extended'

export async function generateRoosterCode(): Promise<string> {
  const codes = await listRoosterCodes()
  let max = 0

  for (const code of codes) {
    const parsed = parseRoosterCodeSequence(code)
    if (parsed != null && parsed > max) {
      max = parsed
    }
  }

  return formatRoosterCode(max + 1)
}

export async function createRooster(
  actorId: string,
  input: CreateRoosterInput
): Promise<{ error?: string; roosterId?: string; roosterCode?: string }> {
  const supabase = await createExtendedClient()
  const roosterCode = await generateRoosterCode()

  const cataloged = await catalogReferenceValues({
    breed: input.breed,
    bloodline: input.bloodline,
  })

  const { data, error } = await supabase
    .from('roosters')
    .insert({
      rooster_code: roosterCode,
      name: input.name ?? null,
      competitor_id: input.competitorId ?? null,
      gamefarm_id: input.gamefarmId ?? null,
      breeder_id: input.breederId ?? null,
      age_class: input.ageClass,
      hatch_date: input.hatchDate ?? null,
      hatch_date_is_estimated: input.hatchDateIsEstimated,
      competition_class: input.competitionClass,
      breed: cataloged.breed,
      bloodline: cataloged.bloodline,
      declared_external_experience_status:
        input.declaredExternalExperienceStatus ?? null,
      calculated_experience_status: 'maiden',
      origin_type: input.originType,
      country_of_origin: input.countryOfOrigin ?? null,
      province_of_origin: input.provinceOfOrigin ?? null,
      municipality_of_origin: input.municipalityOfOrigin ?? null,
      breeder_name_external: input.breederNameExternal ?? null,
      breeding_relationship: input.breedingRelationship,
      origin_notes: input.originNotes ?? null,
      created_by: actorId,
      updated_by: actorId,
    })
    .select('id, rooster_code')
    .single()

  if (error || !data) {
    return { error: error?.message ?? 'Failed to create rooster' }
  }

  await writeAuditLog({
    actorId,
    action: 'rooster.created',
    entityType: 'rooster',
    entityId: data.id,
    newValues: {
      rooster_code: data.rooster_code,
      age_class: input.ageClass,
      competition_class: input.competitionClass,
    },
  })

  return { roosterId: data.id, roosterCode: data.rooster_code }
}

export async function updateRooster(
  actorId: string,
  input: UpdateRoosterInput
): Promise<{ error?: string }> {
  const supabase = await createExtendedClient()

  const { data: existing, error: fetchError } = await supabase
    .from('roosters')
    .select('id, rooster_code, age_class, competition_class')
    .eq('id', input.roosterId)
    .is('deleted_at', null)
    .maybeSingle()

  if (fetchError) return { error: fetchError.message }
  if (!existing) return { error: 'Rooster not found' }

  const cataloged = await catalogReferenceValues({
    breed: input.breed,
    bloodline: input.bloodline,
  })

  const { error } = await supabase
    .from('roosters')
    .update({
      name: input.name ?? null,
      competitor_id: input.competitorId ?? null,
      gamefarm_id: input.gamefarmId ?? null,
      breeder_id: input.breederId ?? null,
      age_class: input.ageClass,
      hatch_date: input.hatchDate ?? null,
      hatch_date_is_estimated: input.hatchDateIsEstimated,
      competition_class: input.competitionClass,
      breed: cataloged.breed,
      bloodline: cataloged.bloodline,
      declared_external_experience_status:
        input.declaredExternalExperienceStatus ?? null,
      origin_type: input.originType,
      country_of_origin: input.countryOfOrigin ?? null,
      province_of_origin: input.provinceOfOrigin ?? null,
      municipality_of_origin: input.municipalityOfOrigin ?? null,
      breeder_name_external: input.breederNameExternal ?? null,
      breeding_relationship: input.breedingRelationship,
      origin_notes: input.originNotes ?? null,
      updated_by: actorId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', input.roosterId)

  if (error) return { error: error.message }

  await writeAuditLog({
    actorId,
    action: 'rooster.updated',
    entityType: 'rooster',
    entityId: input.roosterId,
    oldValues: {
      rooster_code: existing.rooster_code,
      age_class: existing.age_class,
      competition_class: existing.competition_class,
    },
    newValues: {
      age_class: input.ageClass,
      competition_class: input.competitionClass,
    },
  })

  return {}
}

export async function refreshRoosterExperience(
  actorId: string,
  roosterId: string
): Promise<{ error?: string; experienceStatus?: string }> {
  const supabase = await createExtendedClient()
  const { countRoosterFightStats } = await import('@/features/roosters/queries')
  const stats = await countRoosterFightStats(roosterId)
  const experienceStatus = calculateExperienceFromFights(stats)

  const { error } = await supabase
    .from('roosters')
    .update({
      calculated_experience_status: experienceStatus,
      updated_by: actorId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', roosterId)

  if (error) return { error: error.message }

  await writeAuditLog({
    actorId,
    action: 'rooster.experience_refreshed',
    entityType: 'rooster',
    entityId: roosterId,
    newValues: {
      total_fights: stats.totalFights,
      wins: stats.wins,
      calculated_experience_status: experienceStatus,
    },
  })

  return { experienceStatus }
}
