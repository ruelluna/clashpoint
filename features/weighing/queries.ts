import 'server-only'

import type {
  WeighingEntrySummary,
  WeighingReportRow,
  WeighingRow,
  WeighingStationItem,
} from '@/features/weighing/types'
import { createClient } from '@/lib/supabase/server'

export async function listWeighingStationItems(
  eventId: string
): Promise<WeighingStationItem[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('rooster_event_registrations')
    .select(
      `
      id,
      entry_id,
      cock_number,
      band_number,
      declared_weight,
      entries ( entry_number, entry_name ),
      weighings (
        id,
        official_weight,
        weight_status,
        verified_at
      )
    `
    )
    .eq('event_id', eventId)
    .order('cock_number', { ascending: true })

  if (error) throw error

  return (data ?? []).map((row) => {
    const entry = row.entries as { entry_number: string; entry_name: string } | null
    const weighingRaw = row.weighings
    const weighing = Array.isArray(weighingRaw)
      ? weighingRaw[0] ?? null
      : weighingRaw

    return {
      rooster_event_registration_id: row.id as string,
      entry_id: row.entry_id as string,
      entry_number: entry?.entry_number ?? '',
      entry_name: entry?.entry_name ?? '',
      cock_number: row.cock_number as number,
      band_number: row.band_number as string,
      declared_weight:
        row.declared_weight != null ? Number(row.declared_weight) : null,
      weighing_id: (weighing?.id as string | undefined) ?? null,
      official_weight:
        weighing?.official_weight != null
          ? Number(weighing.official_weight)
          : null,
      weight_status: (weighing?.weight_status as WeighingStationItem['weight_status']) ?? null,
      verified_at: (weighing?.verified_at as string | null) ?? null,
    }
  })
}

export async function getWeighingByRooster(
  roosterRecordId: string
): Promise<WeighingRow | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('weighings')
    .select('*')
    .eq('rooster_event_registration_id', roosterRecordId)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  return {
    ...data,
    official_weight:
      data.official_weight != null ? Number(data.official_weight) : null,
  } as WeighingRow
}

export async function listWeighingReport(
  eventId: string
): Promise<WeighingReportRow[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('weighings')
    .select(
      `
      id,
      official_weight,
      weight_status,
      verified_at,
      notes,
      rooster_event_registrations (
        cock_number,
        band_number,
        declared_weight,
        entries ( entry_number, entry_name )
      )
    `
    )
    .eq('event_id', eventId)
    .order('created_at', { ascending: true })

  if (error) throw error

  return (data ?? []).map((row) => {
    const rooster = row.rooster_event_registrations as {
      cock_number: number
      band_number: string
      declared_weight: number | null
      entries: { entry_number: string; entry_name: string } | null
    } | null

    return {
      id: row.id as string,
      entry_number: rooster?.entries?.entry_number ?? '',
      entry_name: rooster?.entries?.entry_name ?? '',
      cock_number: rooster?.cock_number ?? 0,
      band_number: rooster?.band_number ?? '',
      declared_weight:
        rooster?.declared_weight != null ? Number(rooster.declared_weight) : null,
      official_weight:
        row.official_weight != null ? Number(row.official_weight) : null,
      weight_status: row.weight_status as WeighingReportRow['weight_status'],
      verified_at: (row.verified_at as string | null) ?? null,
      notes: (row.notes as string | null) ?? null,
    }
  })
}

export async function countWeighingStats(eventId: string): Promise<{
  total: number
  passed: number
  failed: number
  pending: number
  verified: number
}> {
  const supabase = await createClient()

  const { count: roosterCount, error: roosterError } = await supabase
    .from('rooster_event_registrations')
    .select('id', { count: 'exact', head: true })
    .eq('event_id', eventId)

  if (roosterError) throw roosterError

  const { data, error } = await supabase
    .from('weighings')
    .select('weight_status, verified_at')
    .eq('event_id', eventId)

  if (error) throw error

  let passed = 0
  let failed = 0
  let pending = 0
  let verified = 0

  for (const row of data ?? []) {
    if (row.verified_at) verified += 1
    if (row.weight_status === 'passed') passed += 1
    else if (row.weight_status === 'failed') failed += 1
    else pending += 1
  }

  return {
    total: roosterCount ?? 0,
    passed,
    failed,
    pending,
    verified,
  }
}

export async function listWeighingEntrySummaries(
  eventId: string,
  cocksPerEntry: number
): Promise<WeighingEntrySummary[]> {
  const supabase = await createClient()

  const { data: entries, error: entriesError } = await supabase
    .from('entries')
    .select('id, entry_number, entry_name, owner_name, owner_barcode')
    .eq('event_id', eventId)
    .is('deleted_at', null)
    .order('entry_number', { ascending: true })

  if (entriesError) throw entriesError

  const { data: roosters, error: roostersError } = await supabase
    .from('rooster_event_registrations')
    .select('entry_id')
    .eq('event_id', eventId)

  if (roostersError) throw roostersError

  const countByEntry = new Map<string, number>()
  for (const row of roosters ?? []) {
    const entryId = row.entry_id as string
    countByEntry.set(entryId, (countByEntry.get(entryId) ?? 0) + 1)
  }

  return (entries ?? []).map((entry) => {
    const roosterCount = countByEntry.get(entry.id as string) ?? 0
    return {
      entry_id: entry.id as string,
      entry_number: entry.entry_number as string,
      entry_name: entry.entry_name as string,
      owner_name: entry.owner_name as string,
      owner_barcode: (entry.owner_barcode as string | null) ?? null,
      rooster_count: roosterCount,
      can_add_rooster: roosterCount < cocksPerEntry,
    }
  })
}
