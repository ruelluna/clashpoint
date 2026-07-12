import 'server-only'

import type { EntryListItem, EntryRow, EntryWithEvent } from '@/features/entries/types'
import { createExtendedClient } from '@/lib/supabase/extended'
import { createClient } from '@/lib/supabase/server'

type EntryListRow = EntryListItem & {
  promoters: { name: string } | null
}

export type EntryRoosterEditItem = {
  rooster_id: string
  cock_number: number
  rooster_name: string | null
  band_number: string
  weight: number | null
  color_marking: string | null
  is_paired: boolean
  age_class: string | null
  competition_class: string | null
  hatch_date: string | null
  hatch_date_is_estimated: boolean | null
  breed: string | null
  bloodline: string | null
  origin_type: string | null
  country_of_origin: string | null
  province_of_origin: string | null
  municipality_of_origin: string | null
  breeder_name_external: string | null
  origin_notes: string | null
  breeding_relationship: string | null
  experience_status: string | null
  band_level: string | null
  band_organization: string | null
  band_year: number | null
  band_season: string | null
  eligibility_status: string | null
  eligibility_checks: Array<{
    message: string
    outcome: string
    passed: boolean
  }>
}

export async function listEntriesByEvent(
  eventId: string,
  cocksPerEntry: number
): Promise<EntryListItem[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('entries')
    .select(
      `
      id,
      entry_number,
      entry_name,
      owner_name,
      handler_name,
      contact_number,
      entry_source,
      registration_status,
      payment_status,
      created_at,
      promoters ( name )
    `
    )
    .eq('event_id', eventId)
    .is('deleted_at', null)
    .order('entry_number', { ascending: true })

  if (error) throw error

  const entryIds = ((data ?? []) as Array<{ id: string }>).map((row) => row.id)
  const countByEntry = new Map<string, number>()

  if (entryIds.length > 0) {
    const { data: roosters, error: roosterError } = await supabase
      .from('rooster_event_registrations')
      .select('entry_id')
      .eq('event_id', eventId)
      .in('entry_id', entryIds)

    if (roosterError) throw roosterError

    for (const row of roosters ?? []) {
      const entryId = row.entry_id as string
      countByEntry.set(entryId, (countByEntry.get(entryId) ?? 0) + 1)
    }
  }

  return ((data ?? []) as unknown as EntryListRow[]).map((row) => ({
    id: row.id,
    entry_number: row.entry_number,
    entry_name: row.entry_name,
    owner_name: row.owner_name,
    handler_name: row.handler_name,
    contact_number: row.contact_number,
    entry_source: row.entry_source,
    registration_status: row.registration_status,
    payment_status: row.payment_status,
    created_at: row.created_at,
    promoter_name: row.promoters?.name ?? null,
    rooster_count: countByEntry.get(row.id) ?? 0,
    cocks_per_entry: cocksPerEntry,
  }))
}

export async function getEntry(entryId: string): Promise<EntryRow | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('entries')
    .select('*')
    .eq('id', entryId)
    .is('deleted_at', null)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  return data as EntryRow
}

export async function getEntryWithEvent(entryId: string): Promise<EntryWithEvent | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('entries')
    .select(
      `
      *,
      events ( name, entry_fee )
    `
    )
    .eq('id', entryId)
    .is('deleted_at', null)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  const row = data as unknown as EntryRow & {
    events: { name: string; entry_fee: number } | null
  }

  return {
    ...row,
    event_name: row.events?.name ?? '',
    entry_fee: Number(row.events?.entry_fee ?? 0),
  }
}

export async function listEntryNumbersForEvent(eventId: string): Promise<string[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('entries')
    .select('entry_number')
    .eq('event_id', eventId)
    .is('deleted_at', null)

  if (error) throw error
  return (data ?? []).map((row) => row.entry_number as string)
}

export async function getPairedRosterIdsForEntry(
  eventId: string,
  entryId: string
): Promise<Set<string>> {
  const supabase = await createClient()

  const { data: roosters, error: roosterError } = await supabase
    .from('rooster_event_registrations')
    .select('id')
    .eq('entry_id', entryId)
    .eq('event_id', eventId)

  if (roosterError) throw roosterError

  const roosterIds = (roosters ?? []).map((row) => row.id as string)
  const paired = new Set<string>()

  if (roosterIds.length === 0) return paired

  const { data: matches, error: matchError } = await supabase
    .from('matches')
    .select('meron_entry_id, wala_entry_id, meron_rooster_id, wala_rooster_id')
    .eq('event_id', eventId)
    .or(
      `meron_entry_id.eq.${entryId},wala_entry_id.eq.${entryId},meron_rooster_id.in.(${roosterIds.join(',')}),wala_rooster_id.in.(${roosterIds.join(',')})`
    )

  if (matchError) throw matchError

  for (const match of matches ?? []) {
    if (match.meron_entry_id === entryId && match.meron_rooster_id) {
      paired.add(match.meron_rooster_id as string)
    }
    if (match.wala_entry_id === entryId && match.wala_rooster_id) {
      paired.add(match.wala_rooster_id as string)
    }
    if (roosterIds.includes(match.meron_rooster_id as string)) {
      paired.add(match.meron_rooster_id as string)
    }
    if (roosterIds.includes(match.wala_rooster_id as string)) {
      paired.add(match.wala_rooster_id as string)
    }
  }

  return paired
}

export async function entryHasMatchReferences(
  eventId: string,
  entryId: string
): Promise<boolean> {
  const paired = await getPairedRosterIdsForEntry(eventId, entryId)
  if (paired.size > 0) return true

  const supabase = await createClient()
  const { count, error } = await supabase
    .from('matches')
    .select('id', { count: 'exact', head: true })
    .eq('event_id', eventId)
    .or(`meron_entry_id.eq.${entryId},wala_entry_id.eq.${entryId}`)

  if (error) throw error
  return (count ?? 0) > 0
}

export async function listEntryRoostersForEdit(
  eventId: string,
  entryId: string
): Promise<EntryRoosterEditItem[]> {
  const supabase = await createClient()
  const pairedIds = await getPairedRosterIdsForEntry(eventId, entryId)

  const extended = await createExtendedClient()
  const { data, error } = await extended
    .from('rooster_event_registrations')
    .select(
      `
      id,
      cock_number,
      band_number,
      color_marking,
      eligibility_status,
      eligibility_snapshot,
      registry_rooster_id,
      weighings ( official_weight_grams )
    `
    )
    .eq('entry_id', entryId)
    .eq('event_id', eventId)
    .order('cock_number', { ascending: true })

  if (error) throw error

  const registryIds = (data ?? [])
    .map((row: { registry_rooster_id: string | null }) => row.registry_rooster_id)
    .filter((id: string | null): id is string => Boolean(id))

  const registryMap = new Map<
    string,
    {
      name: string | null
      age_class: string | null
      competition_class: string | null
      hatch_date: string | null
      hatch_date_is_estimated: boolean | null
      breed: string | null
      bloodline: string | null
      origin_type: string | null
      country_of_origin: string | null
      province_of_origin: string | null
      municipality_of_origin: string | null
      breeder_name_external: string | null
      origin_notes: string | null
      breeding_relationship: string | null
      declared_external_experience_status: string | null
      calculated_experience_status: string | null
    }
  >()
  const bandMap = new Map<
    string,
    {
      band_level: string | null
      band_organization: string | null
      band_year: number | null
      band_season: string | null
    }
  >()

  if (registryIds.length > 0) {
    const [{ data: roosters }, { data: bands }] = await Promise.all([
      extended
        .from('roosters')
        .select(
          'id, name, age_class, competition_class, hatch_date, hatch_date_is_estimated, breed, bloodline, origin_type, country_of_origin, province_of_origin, municipality_of_origin, breeder_name_external, origin_notes, breeding_relationship, declared_external_experience_status, calculated_experience_status'
        )
        .in('id', registryIds),
      extended
        .from('rooster_bands')
        .select('rooster_id, band_level, band_organization, band_year, band_season')
        .in('rooster_id', registryIds)
        .order('created_at', { ascending: true }),
    ])

    for (const rooster of roosters ?? []) {
      registryMap.set(rooster.id as string, {
        name: rooster.name as string | null,
        age_class: rooster.age_class as string | null,
        competition_class: rooster.competition_class as string | null,
        hatch_date: rooster.hatch_date as string | null,
        hatch_date_is_estimated: rooster.hatch_date_is_estimated as boolean | null,
        breed: rooster.breed as string | null,
        bloodline: rooster.bloodline as string | null,
        origin_type: rooster.origin_type as string | null,
        country_of_origin: rooster.country_of_origin as string | null,
        province_of_origin: rooster.province_of_origin as string | null,
        municipality_of_origin: rooster.municipality_of_origin as string | null,
        breeder_name_external: rooster.breeder_name_external as string | null,
        origin_notes: rooster.origin_notes as string | null,
        breeding_relationship: rooster.breeding_relationship as string | null,
        declared_external_experience_status:
          rooster.declared_external_experience_status as string | null,
        calculated_experience_status: rooster.calculated_experience_status as string | null,
      })
    }

    for (const band of bands ?? []) {
      const roosterId = band.rooster_id as string
      if (!bandMap.has(roosterId)) {
        bandMap.set(roosterId, {
          band_level: band.band_level as string | null,
          band_organization: band.band_organization as string | null,
          band_year: band.band_year as number | null,
          band_season: band.band_season as string | null,
        })
      }
    }
  }

  return (data ?? []).map((row: Record<string, unknown>) => {
    const weighingRaw = row.weighings
    const weighing = Array.isArray(weighingRaw)
      ? weighingRaw[0] ?? null
      : weighingRaw

    const roosterId = row.id as string
    const registryId = row.registry_rooster_id as string | null
    const registry = registryId ? registryMap.get(registryId) : undefined
    const band = registryId ? bandMap.get(registryId) : undefined
    const snapshot = row.eligibility_snapshot as
      | { checks?: Array<{ message: string; outcome: string; passed: boolean }> }
      | null

    return {
      rooster_id: roosterId,
      cock_number: Number(row.cock_number),
      rooster_name: registry?.name ?? null,
      band_number: row.band_number as string,
      weight:
        weighing?.official_weight_grams != null
          ? Number(weighing.official_weight_grams)
          : null,
      color_marking: (row.color_marking as string | null) ?? null,
      is_paired: pairedIds.has(roosterId),
      age_class: registry?.age_class ?? null,
      competition_class: registry?.competition_class ?? null,
      hatch_date: registry?.hatch_date ?? null,
      hatch_date_is_estimated: registry?.hatch_date_is_estimated ?? null,
      breed: registry?.breed ?? null,
      bloodline: registry?.bloodline ?? null,
      origin_type: registry?.origin_type ?? null,
      country_of_origin: registry?.country_of_origin ?? null,
      province_of_origin: registry?.province_of_origin ?? null,
      municipality_of_origin: registry?.municipality_of_origin ?? null,
      breeder_name_external: registry?.breeder_name_external ?? null,
      origin_notes: registry?.origin_notes ?? null,
      breeding_relationship: registry?.breeding_relationship ?? null,
      experience_status:
        registry?.declared_external_experience_status ??
        registry?.calculated_experience_status ??
        null,
      band_level: band?.band_level ?? null,
      band_organization: band?.band_organization ?? null,
      band_year: band?.band_year ?? null,
      band_season: band?.band_season ?? null,
      eligibility_status: (row.eligibility_status as string | null) ?? null,
      eligibility_checks: snapshot?.checks ?? [],
    }
  })
}
