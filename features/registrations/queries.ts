import 'server-only'

import type {
  RegistrationListItem,
  RegistrationWithRelations,
  RoosterEventRegistrationRow,
} from '@/features/registrations/types'
import { createExtendedClient } from '@/lib/supabase/extended'

type RegistrationListRow = RegistrationListItem & {
  entries: {
    entry_number: string
    entry_name: string
  } | null
  roosters: { rooster_code: string } | null
}

type RegistrationDetailRow = RoosterEventRegistrationRow & {
  entries: {
    entry_number: string
    entry_name: string
    owner_name: string
    competitor_id: string | null
    entry_division: string
  } | null
  roosters: {
    rooster_code: string
    age_class: string
    competition_class: string
    calculated_experience_status: string
    origin_type: string
    breeding_relationship: string
  } | null
}

export async function getRegistration(
  registrationId: string
): Promise<RoosterEventRegistrationRow | null> {
  const supabase = await createExtendedClient()
  const { data, error } = await supabase
    .from('rooster_event_registrations')
    .select('*')
    .eq('id', registrationId)
    .maybeSingle()

  if (error) throw error
  return (data as RoosterEventRegistrationRow | null) ?? null
}

export async function getRegistrationForEvent(
  eventId: string,
  registrationId: string
): Promise<RoosterEventRegistrationRow | null> {
  const supabase = await createExtendedClient()
  const { data, error } = await supabase
    .from('rooster_event_registrations')
    .select('*')
    .eq('id', registrationId)
    .eq('event_id', eventId)
    .maybeSingle()

  if (error) throw error
  return (data as RoosterEventRegistrationRow | null) ?? null
}

export async function getRegistrationWithRelations(
  eventId: string,
  registrationId: string
): Promise<RegistrationWithRelations | null> {
  const supabase = await createExtendedClient()
  const { data, error } = await supabase
    .from('rooster_event_registrations')
    .select(
      `
      *,
      entries (
        entry_number,
        entry_name,
        owner_name,
        competitor_id,
        entry_division
      ),
      roosters:registry_rooster_id (
        rooster_code,
        age_class,
        competition_class,
        calculated_experience_status,
        origin_type,
        breeding_relationship
      )
    `
    )
    .eq('id', registrationId)
    .eq('event_id', eventId)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  const row = data as unknown as RegistrationDetailRow
  return {
    ...row,
    entry_number: row.entries?.entry_number ?? '',
    entry_name: row.entries?.entry_name ?? '',
    owner_name: row.entries?.owner_name ?? '',
    competitor_id: row.entries?.competitor_id ?? null,
    entry_division: row.entries?.entry_division ?? 'unassigned',
    rooster_code: row.roosters?.rooster_code ?? null,
    age_class: row.roosters?.age_class ?? null,
    competition_class: row.roosters?.competition_class ?? null,
    calculated_experience_status: row.roosters?.calculated_experience_status ?? null,
    origin_type: row.roosters?.origin_type ?? null,
    breeding_relationship: row.roosters?.breeding_relationship ?? null,
  }
}

export async function listRegistrationsByEvent(
  eventId: string
): Promise<RegistrationListItem[]> {
  const supabase = await createExtendedClient()
  const { data, error } = await supabase
    .from('rooster_event_registrations')
    .select(
      `
      id,
      entry_id,
      event_id,
      registry_rooster_id,
      cock_number,
      band_number,
      registration_status,
      approval_status,
      eligibility_status,
      inspection_status,
      reg_payment_status,
      created_at,
      entries ( entry_number, entry_name ),
      roosters:registry_rooster_id ( rooster_code )
    `
    )
    .eq('event_id', eventId)
    .order('created_at', { ascending: true })

  if (error) throw error

  return ((data ?? []) as unknown as RegistrationListRow[]).map((row) => ({
    id: row.id,
    entry_id: row.entry_id,
    event_id: row.event_id,
    registry_rooster_id: row.registry_rooster_id,
    cock_number: row.cock_number,
    band_number: row.band_number,
    registration_status: row.registration_status,
    approval_status: row.approval_status,
    eligibility_status: row.eligibility_status,
    inspection_status: row.inspection_status,
    reg_payment_status: row.reg_payment_status,
    created_at: row.created_at,
    entry_number: row.entries?.entry_number ?? '',
    entry_name: row.entries?.entry_name ?? '',
    rooster_code: row.roosters?.rooster_code ?? null,
  }))
}

export async function listRegistrationsByEntry(
  eventId: string,
  entryId: string
): Promise<RoosterEventRegistrationRow[]> {
  const supabase = await createExtendedClient()
  const { data, error } = await supabase
    .from('rooster_event_registrations')
    .select('*')
    .eq('event_id', eventId)
    .eq('entry_id', entryId)
    .order('cock_number', { ascending: true })

  if (error) throw error
  return (data ?? []) as RoosterEventRegistrationRow[]
}

export async function registrationHasActiveMatch(
  eventId: string,
  registrationId: string
): Promise<boolean> {
  const supabase = await createExtendedClient()
  const { count, error } = await supabase
    .from('matches')
    .select('id', { count: 'exact', head: true })
    .eq('event_id', eventId)
    .or(`meron_rooster_id.eq.${registrationId},wala_rooster_id.eq.${registrationId}`)
    .not('status', 'eq', 'cancelled')

  if (error) throw error
  return (count ?? 0) > 0
}
