import 'server-only'

import type {
  EventListItem,
  EventRow,
  EventWithPrize,
  PrizeConfigEntry,
  PrizeStructureRow,
} from '@/features/events/types'
import type { Json } from '@/lib/supabase/database.types'
import { createClient } from '@/lib/supabase/server'

type EventListRow = {
  id: string
  name: string
  venue: string
  event_date: string
  event_type: EventListItem['event_type']
  event_format: EventListItem['event_format']
  derby_type: EventListItem['derby_type']
  status: EventListItem['status']
  entry_fee: number
  is_public: boolean
  promoters: { name: string } | null
}

type EventWithPrizeRow = EventRow & {
  promoters: { name: string } | null
  prize_structures: PrizeStructureRow | PrizeStructureRow[] | null
}

export async function listEvents(): Promise<EventListItem[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('events')
    .select(
      'id, name, venue, event_date, event_type, event_format, derby_type, status, entry_fee, is_public, promoters ( name )'
    )
    .is('deleted_at', null)
    .order('event_date', { ascending: false })

  if (error) throw error

  return ((data ?? []) as unknown as EventListRow[]).map((row) => ({
    id: row.id,
    name: row.name,
    venue: row.venue,
    event_date: row.event_date,
    event_type: row.event_type,
    event_format: row.event_format,
    derby_type: row.derby_type,
    status: row.status,
    entry_fee: Number(row.entry_fee),
    is_public: row.is_public,
    promoter_name: row.promoters?.name ?? null,
  }))
}

export async function getEvent(eventId: string): Promise<EventRow | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', eventId)
    .is('deleted_at', null)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  return mapEventRow(data)
}

export async function getEventWithPrize(
  eventId: string
): Promise<EventWithPrize | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('events')
    .select(
      `
      *,
      promoters ( name ),
      prize_structures ( * )
    `
    )
    .eq('id', eventId)
    .is('deleted_at', null)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  const row = data as unknown as EventWithPrizeRow
  const prizeStructures = row.prize_structures
  const prizeStructure = Array.isArray(prizeStructures)
    ? prizeStructures[0] ?? null
    : prizeStructures

  const event = mapEventRow(row)

  return {
    ...event,
    promoter_name: row.promoters?.name ?? null,
    prize_structure: prizeStructure
      ? {
          ...prizeStructure,
          config: prizeStructure.config as PrizeConfigEntry[],
        }
      : null,
  }
}

function mapEventRow(data: Record<string, unknown>): EventRow {
  return {
    id: data.id as string,
    promoter_id: (data.promoter_id as string | null) ?? null,
    name: data.name as string,
    venue: data.venue as string,
    event_date: data.event_date as string,
    registration_deadline: (data.registration_deadline as string | null) ?? null,
    event_type: data.event_type as EventRow['event_type'],
    event_format: data.event_format as EventRow['event_format'],
    derby_type: (data.derby_type as EventRow['derby_type']) ?? null,
    entry_fee: Number(data.entry_fee),
    min_entries: data.min_entries != null ? Number(data.min_entries) : null,
    max_entries: data.max_entries != null ? Number(data.max_entries) : null,
    cocks_per_entry: Number(data.cocks_per_entry),
    min_weight: data.min_weight != null ? Number(data.min_weight) : null,
    max_weight: data.max_weight != null ? Number(data.max_weight) : null,
    scoring_system: data.scoring_system as EventRow['scoring_system'],
    draw_rule: data.draw_rule as string,
    tie_breaker_rule: data.tie_breaker_rule as string,
    status: data.status as EventRow['status'],
    guaranteed_prize_amount:
      data.guaranteed_prize_amount != null
        ? Number(data.guaranteed_prize_amount)
        : null,
    house_deduction:
      data.house_deduction != null ? Number(data.house_deduction) : null,
    venue_share: data.venue_share != null ? Number(data.venue_share) : null,
    legal_authorized: Boolean(data.legal_authorized),
    is_public: Boolean(data.is_public),
    publish_matches: Boolean(data.publish_matches),
    publish_standings: Boolean(data.publish_standings),
    publish_winners: Boolean(data.publish_winners),
    publish_prize_amounts: Boolean(data.publish_prize_amounts),
    notes: (data.notes as string | null) ?? null,
    created_by: (data.created_by as string | null) ?? null,
    created_at: data.created_at as string,
    updated_at: data.updated_at as string,
    deleted_at: (data.deleted_at as string | null) ?? null,
  }
}

export type { Json }
