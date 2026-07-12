import 'server-only'

import type {
  RoosterBandRow,
  RoosterFightOutcome,
  RoosterListItem,
  RoosterParticipationItem,
  RoosterRow,
  RoosterWithBands,
} from '@/features/roosters/types'
import { createExtendedClient } from '@/lib/supabase/extended'

export async function getRooster(roosterId: string): Promise<RoosterRow | null> {
  const supabase = await createExtendedClient()
  const { data, error } = await supabase
    .from('roosters')
    .select('*')
    .eq('id', roosterId)
    .is('deleted_at', null)
    .maybeSingle()

  if (error) throw error
  return (data as RoosterRow | null) ?? null
}

export async function getRoosterWithBands(
  roosterId: string
): Promise<RoosterWithBands | null> {
  const supabase = await createExtendedClient()
  const { data, error } = await supabase
    .from('roosters')
    .select(
      `
      *,
      rooster_bands (*)
    `
    )
    .eq('id', roosterId)
    .is('deleted_at', null)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  const row = data as RoosterRow & { rooster_bands: RoosterBandRow[] | null }
  return {
    ...row,
    bands: row.rooster_bands ?? [],
  }
}

export async function listRoosters(): Promise<RoosterListItem[]> {
  const supabase = await createExtendedClient()
  const { data, error } = await supabase
    .from('roosters')
    .select(
      'id, rooster_code, name, age_class, competition_class, calculated_experience_status, origin_type, created_at'
    )
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as RoosterListItem[]
}

export async function listRoosterParticipations(
  roosterId: string
): Promise<RoosterParticipationItem[]> {
  const supabase = await createExtendedClient()
  const { data, error } = await supabase
    .from('rooster_event_registrations')
    .select(
      `
      id,
      event_id,
      cock_number,
      band_number,
      registration_status,
      approval_status,
      eligibility_status,
      created_at,
      entries ( entry_number, entry_name ),
      events ( name )
    `
    )
    .eq('registry_rooster_id', roosterId)
    .order('created_at', { ascending: false })

  if (error) throw error

  type ParticipationRow = {
    id: string
    event_id: string
    cock_number: number
    band_number: string
    registration_status: string
    approval_status: string
    eligibility_status: string
    created_at: string
    entries: { entry_number: string; entry_name: string } | null
    events: { name: string } | null
  }

  return ((data ?? []) as unknown as ParticipationRow[]).map((row) => ({
    id: row.id,
    event_id: row.event_id,
    event_name: row.events?.name ?? 'Unknown event',
    entry_number: row.entries?.entry_number ?? '',
    entry_name: row.entries?.entry_name ?? '',
    cock_number: row.cock_number,
    band_number: row.band_number,
    registration_status: row.registration_status,
    approval_status: row.approval_status,
    eligibility_status: row.eligibility_status,
    created_at: row.created_at,
  }))
}

export async function listRoosterCodes(): Promise<string[]> {
  const supabase = await createExtendedClient()
  const { data, error } = await supabase
    .from('roosters')
    .select('rooster_code')
    .is('deleted_at', null)

  if (error) throw error
  return (data ?? []).map((row: { rooster_code: string }) => row.rooster_code)
}

export async function getRoosterFightHistory(
  roosterId: string
): Promise<RoosterFightOutcome[]> {
  const supabase = await createExtendedClient()

  const { data: registrations, error: registrationError } = await supabase
    .from('rooster_event_registrations')
    .select('id')
    .eq('registry_rooster_id', roosterId)

  if (registrationError) throw registrationError

  const registrationIds = (registrations ?? []).map(
    (row: { id: string }) => row.id
  )
  if (registrationIds.length === 0) return []

  const { data: matches, error: matchError } = await supabase
    .from('matches')
    .select('id, event_id, meron_rooster_id, wala_rooster_id, status')
    .or(
      registrationIds
        .flatMap((id: string) => [
          `meron_rooster_id.eq.${id}`,
          `wala_rooster_id.eq.${id}`,
        ])
        .join(',')
    )
    .eq('status', 'completed')

  if (matchError) throw matchError
  if (!matches || matches.length === 0) return []

  const matchIds = matches.map((row: { id: string }) => row.id)
  const { data: results, error: resultError } = await supabase
    .from('fight_results')
    .select('match_id, result_type, winning_side, result_status')
    .in('match_id', matchIds)
    .in('result_status', ['verified', 'final'])

  if (resultError) throw resultError

  type FightResultRow = {
    match_id: string
    result_type: string
    winning_side: string | null
    result_status: string
  }

  const resultByMatch = new Map(
    ((results ?? []) as FightResultRow[]).map((row) => [row.match_id, row])
  )

  const outcomes: RoosterFightOutcome[] = []

  for (const match of matches as Array<{
    id: string
    event_id: string
    meron_rooster_id: string
    wala_rooster_id: string
    status: string
  }>) {
    const registrationId = registrationIds.find(
      (id: string) => id === match.meron_rooster_id || id === match.wala_rooster_id
    )
    if (!registrationId) continue

    const result = resultByMatch.get(match.id)
    if (!result) continue

    const isMeron = match.meron_rooster_id === registrationId
    const won =
      (result.result_type === 'meron_win' && isMeron) ||
      (result.result_type === 'wala_win' && !isMeron)

    outcomes.push({
      match_id: match.id,
      event_id: match.event_id,
      result_type: result.result_type,
      won,
      participated: true,
    })
  }

  return outcomes
}

export async function countRoosterFightStats(roosterId: string): Promise<{
  totalFights: number
  wins: number
}> {
  const history = await getRoosterFightHistory(roosterId)
  return {
    totalFights: history.length,
    wins: history.filter((row) => row.won).length,
  }
}
