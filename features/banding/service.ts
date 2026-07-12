import 'server-only'

import { writeAuditLog } from '@/features/audit/service'
import {
  normalizeBandNumber,
  type CheckDuplicateBandInput,
  type CreateBandInput,
  type RejectBandInput,
  type VerifyBandInput,
} from '@/features/banding/schema'
import type { BandDuplicateMatch } from '@/features/banding/types'
import { createExtendedClient } from '@/lib/supabase/extended'

export async function checkDuplicateBand(
  input: CheckDuplicateBandInput
): Promise<{ duplicates: BandDuplicateMatch[] }> {
  const supabase = await createExtendedClient()
  const normalizedNumber = normalizeBandNumber(input.bandNumber)

  let query = supabase
    .from('rooster_bands')
    .select(
      `
      id,
      rooster_id,
      band_organization,
      band_number,
      band_year,
      band_season,
      roosters ( rooster_code )
    `
    )
    .ilike('band_number', normalizedNumber)

  if (input.bandOrganization) {
    query = query.ilike('band_organization', input.bandOrganization.trim())
  }

  if (input.bandYear != null) {
    query = query.eq('band_year', input.bandYear)
  }

  if (input.bandSeason) {
    query = query.ilike('band_season', input.bandSeason.trim())
  }

  if (input.excludeBandId) {
    query = query.neq('id', input.excludeBandId)
  }

  const { data, error } = await query
  if (error) throw error

  const duplicates: BandDuplicateMatch[] = ((data ?? []) as Array<{
    id: string
    rooster_id: string
    band_organization: string | null
    band_number: string
    band_year: number | null
    band_season: string | null
    roosters: { rooster_code: string } | null
  }>).map((row) => ({
    bandId: row.id,
    roosterId: row.rooster_id,
    roosterCode: row.roosters?.rooster_code ?? null,
    bandOrganization: row.band_organization,
    bandNumber: row.band_number,
    bandYear: row.band_year,
    bandSeason: row.band_season,
  }))

  return { duplicates }
}

export async function createBand(
  actorId: string,
  input: CreateBandInput
): Promise<{ error?: string; bandId?: string; duplicateWarning?: string }> {
  const supabase = await createExtendedClient()

  const { data: rooster, error: roosterError } = await supabase
    .from('roosters')
    .select('id, rooster_code')
    .eq('id', input.roosterId)
    .is('deleted_at', null)
    .maybeSingle()

  if (roosterError) return { error: roosterError.message }
  if (!rooster) return { error: 'Rooster not found' }

  const normalizedNumber = normalizeBandNumber(input.bandNumber)
  const duplicateCheck = await checkDuplicateBand({
    bandOrganization: input.bandOrganization,
    bandNumber: normalizedNumber,
    bandYear: input.bandYear,
    bandSeason: input.bandSeason,
  })

  const { data, error } = await supabase
    .from('rooster_bands')
    .insert({
      rooster_id: input.roosterId,
      band_level: input.bandLevel,
      band_organization: input.bandOrganization ?? null,
      band_number: normalizedNumber,
      band_year: input.bandYear ?? null,
      band_season: input.bandSeason ?? null,
      band_location: input.bandLocation ?? null,
      band_color: input.bandColor ?? null,
      proof_attachment: input.proofAttachment ?? null,
      verification_status: 'unverified',
    })
    .select('id')
    .single()

  if (error || !data) {
    return { error: error?.message ?? 'Failed to create band' }
  }

  if (duplicateCheck.duplicates.length > 0) {
    await supabase.from('band_duplicate_warnings').insert({
      band_id: data.id,
      duplicate_band_id: duplicateCheck.duplicates[0]?.bandId ?? null,
      band_organization: input.bandOrganization ?? null,
      band_number: normalizedNumber,
      band_year: input.bandYear ?? null,
      band_season: input.bandSeason ?? null,
      warning_message: `Potential duplicate band ${normalizedNumber} detected`,
    })
  }

  await writeAuditLog({
    actorId,
    action: 'band.created',
    entityType: 'rooster_band',
    entityId: data.id,
    newValues: {
      rooster_id: input.roosterId,
      rooster_code: rooster.rooster_code,
      band_number: normalizedNumber,
      band_level: input.bandLevel,
    },
  })

  return {
    bandId: data.id,
    duplicateWarning:
      duplicateCheck.duplicates.length > 0
        ? `Potential duplicate band detected (${duplicateCheck.duplicates.length} match(es))`
        : undefined,
  }
}

export async function verifyBand(
  actorId: string,
  input: VerifyBandInput
): Promise<{ error?: string }> {
  const supabase = await createExtendedClient()
  const now = new Date().toISOString()

  const { data: existing, error: fetchError } = await supabase
    .from('rooster_bands')
    .select('id, rooster_id, band_number, verification_status')
    .eq('id', input.bandId)
    .maybeSingle()

  if (fetchError) return { error: fetchError.message }
  if (!existing) return { error: 'Band not found' }
  if (existing.verification_status === 'verified') {
    return { error: 'Band is already verified' }
  }

  const { error } = await supabase
    .from('rooster_bands')
    .update({
      verification_status: 'verified',
      verification_notes: input.verificationNotes ?? null,
      verified_by: actorId,
      verified_at: now,
      updated_at: now,
    })
    .eq('id', input.bandId)

  if (error) return { error: error.message }

  await writeAuditLog({
    actorId,
    action: 'band.verified',
    entityType: 'rooster_band',
    entityId: input.bandId,
    newValues: {
      rooster_id: existing.rooster_id,
      band_number: existing.band_number,
      verification_status: 'verified',
    },
  })

  return {}
}

export async function rejectBand(
  actorId: string,
  input: RejectBandInput
): Promise<{ error?: string }> {
  const supabase = await createExtendedClient()
  const now = new Date().toISOString()

  const { data: existing, error: fetchError } = await supabase
    .from('rooster_bands')
    .select('id, rooster_id, band_number, verification_status')
    .eq('id', input.bandId)
    .maybeSingle()

  if (fetchError) return { error: fetchError.message }
  if (!existing) return { error: 'Band not found' }

  const { error } = await supabase
    .from('rooster_bands')
    .update({
      verification_status: 'rejected',
      verification_notes: input.verificationNotes,
      verified_by: actorId,
      verified_at: now,
      updated_at: now,
    })
    .eq('id', input.bandId)

  if (error) return { error: error.message }

  await writeAuditLog({
    actorId,
    action: 'band.rejected',
    entityType: 'rooster_band',
    entityId: input.bandId,
    reason: input.verificationNotes,
    newValues: {
      rooster_id: existing.rooster_id,
      band_number: existing.band_number,
      verification_status: 'rejected',
    },
  })

  return {}
}
