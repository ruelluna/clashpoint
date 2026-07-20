import 'server-only'

import { isRoosterRegistrationMatchable } from '@/features/compatibility/matchability'
import type { ConditionallyApprovedMatchHandling } from '@/lib/derby/enums'
import type {
  EligibleRooster,
  FightQueueSummary,
  MatchBetPaymentStatus,
  MatchListItem,
  MatchRow,
  MatchStatus,
} from '@/features/matches/types'
import { createClient } from '@/lib/supabase/server'

type MatchQueryRow = {
  id: string
  event_id: string
  fight_number: number
  round_number: number | null
  status: MatchStatus
  queue_status: MatchRow['queue_status']
  meron_weight: number | null
  wala_weight: number | null
  meron_entry: {
    id: string
    entry_number: string
    entry_name: string
    owner_name: string
  } | null
  wala_entry: {
    id: string
    entry_number: string
    entry_name: string
    owner_name: string
  } | null
  meron_rooster: {
    id: string
    cock_number: number
    band_number: string
  } | null
  wala_rooster: {
    id: string
    cock_number: number
    band_number: string
  } | null
}

type BetRow = {
  match_id: string
  side: 'meron' | 'wala'
  amount: number
  collected_amount: number
  barcode: string
  payment_status: MatchBetPaymentStatus
}

type RoosterQueryRow = {
  id: string
  entry_id: string
  cock_number: number
  band_number: string
  category: string | null
  cock_entry_barcode: string | null
  status: string
  registration_status: string
  approval_status: string
  eligibility_status: string
  inspection_status: string
  reg_payment_status: string
  weight_verified: boolean | null
  entries: {
    entry_number: string
    entry_name: string
  } | null
  weighings: {
    official_weight: number | null
    weight_status: string
  } | null
}

type SideBetDetails = {
  amount: number
  collected_amount: number
  barcode: string | null
  payment_status: MatchBetPaymentStatus
}

function mapMatchRow(
  row: MatchQueryRow,
  betsByMatch: Map<string, { meron: SideBetDetails; wala: SideBetDetails }>
): MatchListItem {
  const bets = betsByMatch.get(row.id) ?? {
    meron: { amount: 0, collected_amount: 0, barcode: null, payment_status: 'unpaid' as const },
    wala: { amount: 0, collected_amount: 0, barcode: null, payment_status: 'unpaid' as const },
  }
  return {
    id: row.id,
    event_id: row.event_id,
    fight_number: Number(row.fight_number),
    round_number: row.round_number != null ? Number(row.round_number) : null,
    status: row.status,
    queue_status: row.queue_status,
    meron: {
      entry_id: row.meron_entry?.id ?? '',
      entry_number: row.meron_entry?.entry_number ?? '—',
      entry_name: row.meron_entry?.entry_name ?? '—',
      owner_name: row.meron_entry?.owner_name ?? '—',
      rooster_id: row.meron_rooster?.id ?? '',
      cock_number: Number(row.meron_rooster?.cock_number ?? 0),
      band_number: row.meron_rooster?.band_number ?? '—',
      weight: row.meron_weight != null ? Number(row.meron_weight) : null,
      bet_amount: bets.meron.amount,
      bet_collected_amount: bets.meron.collected_amount,
      bet_barcode: bets.meron.barcode,
      bet_payment_status: bets.meron.payment_status,
    },
    wala: {
      entry_id: row.wala_entry?.id ?? '',
      entry_number: row.wala_entry?.entry_number ?? '—',
      entry_name: row.wala_entry?.entry_name ?? '—',
      owner_name: row.wala_entry?.owner_name ?? '—',
      rooster_id: row.wala_rooster?.id ?? '',
      cock_number: Number(row.wala_rooster?.cock_number ?? 0),
      band_number: row.wala_rooster?.band_number ?? '—',
      weight: row.wala_weight != null ? Number(row.wala_weight) : null,
      bet_amount: bets.wala.amount,
      bet_collected_amount: bets.wala.collected_amount,
      bet_barcode: bets.wala.barcode,
      bet_payment_status: bets.wala.payment_status,
    },
  }
}

async function loadBetsByMatchIds(
  matchIds: string[]
): Promise<Map<string, { meron: SideBetDetails; wala: SideBetDetails }>> {
  const map = new Map<string, { meron: SideBetDetails; wala: SideBetDetails }>()
  if (matchIds.length === 0) return map

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('match_bets')
    .select('match_id, side, amount, collected_amount, barcode, payment_status')
    .in('match_id', matchIds)

  if (error) throw error

  for (const row of (data ?? []) as BetRow[]) {
    const matchId = row.match_id
    const current = map.get(matchId) ?? {
      meron: { amount: 0, collected_amount: 0, barcode: null, payment_status: 'unpaid' as const },
      wala: { amount: 0, collected_amount: 0, barcode: null, payment_status: 'unpaid' as const },
    }
    if (row.side === 'meron') {
      current.meron = {
        amount: Number(row.amount),
        collected_amount: Number(row.collected_amount),
        barcode: row.barcode,
        payment_status: row.payment_status,
      }
    }
    if (row.side === 'wala') {
      current.wala = {
        amount: Number(row.amount),
        collected_amount: Number(row.collected_amount),
        barcode: row.barcode,
        payment_status: row.payment_status,
      }
    }
    map.set(matchId, current)
  }

  return map
}

const MATCH_SELECT = `
  id,
  event_id,
  fight_number,
  round_number,
  status,
  queue_status,
  meron_weight,
  wala_weight,
  meron_entry:entries!matches_meron_entry_id_fkey ( id, entry_number, entry_name, owner_name ),
  wala_entry:entries!matches_wala_entry_id_fkey ( id, entry_number, entry_name, owner_name ),
  meron_rooster:rooster_event_registrations!matches_meron_rooster_id_fkey ( id, cock_number, band_number ),
  wala_rooster:rooster_event_registrations!matches_wala_rooster_id_fkey ( id, cock_number, band_number )
`

export async function listMatchesByEvent(eventId: string): Promise<MatchListItem[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('matches')
    .select(MATCH_SELECT)
    .eq('event_id', eventId)
    .neq('status', 'cancelled')
    .order('fight_number', { ascending: true })

  if (error) throw error
  const rows = (data ?? []) as unknown as MatchQueryRow[]
  const betsByMatch = await loadBetsByMatchIds(rows.map((row) => row.id))
  return rows.map((row) => mapMatchRow(row, betsByMatch))
}

export async function listAwaitingPaymentMatches(eventId: string): Promise<MatchListItem[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('matches')
    .select(MATCH_SELECT)
    .eq('event_id', eventId)
    .eq('status', 'draft')
    .is('queue_status', null)
    .order('fight_number', { ascending: true })

  if (error) throw error
  const rows = (data ?? []) as unknown as MatchQueryRow[]
  const betsByMatch = await loadBetsByMatchIds(rows.map((row) => row.id))
  return rows.map((row) => mapMatchRow(row, betsByMatch))
}

export async function listFightQueueByEvent(eventId: string): Promise<MatchListItem[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('matches')
    .select(MATCH_SELECT)
    .eq('event_id', eventId)
    .in('status', ['queued', 'at_pit', 'fighting'])
    .not('queue_status', 'is', null)
    .order('fight_number', { ascending: true })

  if (error) throw error
  const rows = (data ?? []) as unknown as MatchQueryRow[]
  const betsByMatch = await loadBetsByMatchIds(rows.map((row) => row.id))
  return rows.map((row) => mapMatchRow(row, betsByMatch))
}

export async function getMatchById(
  eventId: string,
  matchId: string
): Promise<MatchListItem | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('matches')
    .select(MATCH_SELECT)
    .eq('event_id', eventId)
    .eq('id', matchId)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  const row = data as unknown as MatchQueryRow
  const betsByMatch = await loadBetsByMatchIds([row.id])
  return mapMatchRow(row, betsByMatch)
}

export async function getEligibleRoostersForMatching(
  eventId: string
): Promise<EligibleRooster[]> {
  const supabase = await createClient()

  const [
    { data: roosters, error: roosterError },
    { data: matches, error: matchError },
    { data: event, error: eventError },
    { data: policy, error: policyError },
  ] = await Promise.all([
    supabase
      .from('rooster_event_registrations')
      .select(
        `
          id,
          entry_id,
          cock_number,
          band_number,
          category,
          cock_entry_barcode,
          status,
          registration_status,
          approval_status,
          eligibility_status,
          inspection_status,
          reg_payment_status,
          weight_verified,
          entries ( entry_number, entry_name ),
          weighings ( official_weight, weight_status )
        `
      )
      .eq('event_id', eventId)
      .order('cock_number', { ascending: true }),
    supabase
      .from('matches')
      .select('meron_rooster_id, wala_rooster_id, status')
      .eq('event_id', eventId),
    supabase
      .from('events')
      .select(
        'weight_verification_required, physical_inspection_required, conditionally_approved_match_handling'
      )
      .eq('id', eventId)
      .maybeSingle(),
    supabase
      .from('derby_eligibility_policies')
      .select('physical_inspection_required, entry_fee_payment_required')
      .eq('event_id', eventId)
      .maybeSingle(),
  ])

  if (roosterError) throw roosterError
  if (matchError) throw matchError
  if (eventError) throw eventError
  if (policyError) throw policyError

  const usedIds = new Set<string>()
  for (const match of matches ?? []) {
    const status = match.status as MatchStatus
    if (['cancelled', 'completed'].includes(status)) continue
    usedIds.add(match.meron_rooster_id as string)
    usedIds.add(match.wala_rooster_id as string)
  }

  const eventRow = event as {
    weight_verification_required?: boolean | null
    physical_inspection_required?: boolean | null
    conditionally_approved_match_handling?: ConditionallyApprovedMatchHandling | null
  } | null
  const policyRow = policy as {
    physical_inspection_required?: boolean | null
    entry_fee_payment_required?: boolean | null
  } | null

  const physicalInspectionRequired = Boolean(
    eventRow?.physical_inspection_required || policyRow?.physical_inspection_required
  )
  const entryFeePaymentRequired = Boolean(policyRow?.entry_fee_payment_required)
  const conditionallyApprovedMatchHandling =
    eventRow?.conditionally_approved_match_handling ?? 'exclude'

  return ((roosters ?? []) as unknown as RoosterQueryRow[])
    .filter((row) => {
      const matchability = isRoosterRegistrationMatchable({
        registrationStatus: row.registration_status as never,
        approvalStatus: row.approval_status,
        eligibilityStatus: row.eligibility_status,
        weightVerified: Boolean(row.weight_verified),
        weightVerificationRequired: Boolean(eventRow?.weight_verification_required),
        inspectionStatus: row.inspection_status,
        physicalInspectionRequired,
        regPaymentStatus: row.reg_payment_status,
        entryFeePaymentRequired,
        conditionallyApprovedMatchHandling,
      })
      if (!matchability.matchable) return false
      if (row.status !== 'verified') return false
      if ((row.weighings?.weight_status ?? null) !== 'passed') return false
      return true
    })
    .filter((row) => !usedIds.has(row.id))
    .map((row) => ({
      rooster_id: row.id,
      entry_id: row.entry_id,
      entry_number: row.entries?.entry_number ?? '—',
      entry_name: row.entries?.entry_name ?? '—',
      cock_number: Number(row.cock_number),
      band_number: row.band_number,
      cock_entry_barcode: row.cock_entry_barcode,
      official_weight:
        row.weighings?.official_weight != null
          ? Number(row.weighings.official_weight)
          : null,
      category: row.category,
    }))
}

export async function listOngoingFightQueueSummaries(): Promise<FightQueueSummary[]> {
  const supabase = await createClient()

  const { data: events, error: eventsError } = await supabase
    .from('events')
    .select('id, name, venue')
    .eq('status', 'in_progress')
    .is('deleted_at', null)
    .order('event_date', { ascending: true })

  if (eventsError) throw eventsError
  if (!events?.length) return []

  const eventIds = events.map((event) => event.id)
  const { data: matches, error: matchesError } = await supabase
    .from('matches')
    .select('event_id, fight_number, queue_status')
    .in('event_id', eventIds)
    .in('status', ['queued', 'at_pit', 'fighting'])

  if (matchesError) throw matchesError

  const matchesByEvent = new Map<string, Array<{ fight_number: number; queue_status: string | null }>>()
  for (const match of matches ?? []) {
    const list = matchesByEvent.get(match.event_id as string) ?? []
    list.push({
      fight_number: Number(match.fight_number),
      queue_status: match.queue_status as string | null,
    })
    matchesByEvent.set(match.event_id as string, list)
  }

  return events.map((event) => {
    const eventMatches = matchesByEvent.get(event.id) ?? []
    const waiting_count = eventMatches.filter((m) => m.queue_status === 'waiting').length
    const handlers_called_count = eventMatches.filter(
      (m) => m.queue_status === 'handlers_called'
    ).length
    const birds_at_pit_count = eventMatches.filter(
      (m) => m.queue_status === 'birds_at_pit'
    ).length
    const fighting = eventMatches.find((m) => m.queue_status === 'fighting')

    return {
      event_id: event.id,
      event_name: event.name,
      venue: event.venue,
      total_fights: eventMatches.length,
      waiting_count,
      handlers_called_count,
      birds_at_pit_count,
      fighting_count: fighting ? 1 : 0,
      current_fight_number: fighting?.fight_number ?? null,
    }
  })
}
