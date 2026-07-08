import 'server-only'

import { listStandingsForEvent } from '@/features/standings/queries'
import type {
  PromoterAssignedEvent,
  PromoterDashboardStats,
  PromoterEventSummary,
  PromoterSettlementSummary,
} from '@/features/promoter-portal/types'
import { isSystemOwnerRole } from '@/lib/auth/permissions'
import type { Profile } from '@/lib/auth/types'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

type PromoterRow = {
  id: string
  name: string
  user_id: string | null
}

async function getPromoterForUser(userId: string): Promise<PromoterRow | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('promoters')
    .select('id, name, user_id')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .maybeSingle()

  if (error) throw error
  return (data as PromoterRow | null) ?? null
}

async function countReferredEntries(
  promoterId: string,
  eventId?: string
): Promise<number> {
  const supabase = createAdminClient()
  let query = supabase
    .from('entries')
    .select('id', { count: 'exact', head: true })
    .eq('referred_by_promoter_id', promoterId)
    .is('deleted_at', null)

  if (eventId) {
    query = query.eq('event_id', eventId)
  }

  const { count, error } = await query
  if (error) throw error
  return count ?? 0
}

async function assertPromoterEventAccess(
  profile: Profile,
  eventId: string
): Promise<{ promoterId: string | null; isOwner: boolean }> {
  const isOwner = isSystemOwnerRole(profile.role)
  const promoter = isOwner ? null : await getPromoterForUser(profile.id)

  if (!isOwner && !promoter) {
    throw new Error('Promoter profile not linked')
  }

  if (isOwner) {
    return { promoterId: null, isOwner: true }
  }

  const supabase = createAdminClient()
  const [{ data: event, error: eventError }, referredCount] = await Promise.all([
    supabase
      .from('events')
      .select('id, promoter_id')
      .eq('id', eventId)
      .is('deleted_at', null)
      .maybeSingle(),
    countReferredEntries(promoter!.id, eventId),
  ])

  if (eventError) throw eventError
  if (!event) throw new Error('Event not found')

  const isAssigned = event.promoter_id === promoter!.id
  if (!isAssigned && referredCount === 0) {
    throw new Error('Event not assigned to promoter')
  }

  return { promoterId: promoter!.id, isOwner: false }
}

function mapSettlement(row: Record<string, unknown>): PromoterSettlementSummary {
  return {
    id: row.id as string,
    settlement_reference: row.settlement_reference as string,
    gross_collection: Number(row.gross_collection),
    eligible_collection: Number(row.eligible_collection),
    total_expenses: Number(row.total_expenses),
    prize_pool: Number(row.prize_pool),
    promoter_commission: Number(row.promoter_commission),
    amount_payable: Number(row.amount_payable),
    amount_receivable: Number(row.amount_receivable),
    settlement_status: row.settlement_status as string,
    settled_at: (row.settled_at as string | null) ?? null,
  }
}

export async function getPromoterDashboard(
  profile: Profile
): Promise<PromoterDashboardStats> {
  const isOwner = isSystemOwnerRole(profile.role)
  const promoter = isOwner ? null : await getPromoterForUser(profile.id)

  if (!isOwner && !promoter) {
    return {
      promoter_id: null,
      promoter_name: null,
      assigned_events_count: 0,
      upcoming_events_count: 0,
      referred_entries_count: 0,
      pending_settlements_count: 0,
    }
  }

  const supabase = createAdminClient()
  const now = new Date().toISOString()

  if (isOwner) {
    const [
      { count: assignedCount, error: eventsError },
      { count: upcomingCount, error: upcomingError },
      { count: pendingCount, error: settlementsError },
    ] = await Promise.all([
      supabase
        .from('events')
        .select('id', { count: 'exact', head: true })
        .is('deleted_at', null),
      supabase
        .from('events')
        .select('id', { count: 'exact', head: true })
        .is('deleted_at', null)
        .gte('event_date', now),
      supabase
        .from('promoter_settlements')
        .select('id', { count: 'exact', head: true })
        .eq('settlement_status', 'pending'),
    ])

    if (eventsError) throw eventsError
    if (upcomingError) throw upcomingError
    if (settlementsError) throw settlementsError

    return {
      promoter_id: null,
      promoter_name: null,
      assigned_events_count: assignedCount ?? 0,
      upcoming_events_count: upcomingCount ?? 0,
      referred_entries_count: 0,
      pending_settlements_count: pendingCount ?? 0,
    }
  }

  const promoterId = promoter!.id
  const [
    { count: assignedCount, error: eventsError },
    { count: upcomingCount, error: upcomingError },
    referredCount,
    { count: pendingCount, error: settlementsError },
  ] = await Promise.all([
    supabase
      .from('events')
      .select('id', { count: 'exact', head: true })
      .eq('promoter_id', promoterId)
      .is('deleted_at', null),
    supabase
      .from('events')
      .select('id', { count: 'exact', head: true })
      .eq('promoter_id', promoterId)
      .is('deleted_at', null)
      .gte('event_date', now),
    countReferredEntries(promoterId),
    supabase
      .from('promoter_settlements')
      .select('id', { count: 'exact', head: true })
      .eq('promoter_id', promoterId)
      .eq('settlement_status', 'pending'),
  ])

  if (eventsError) throw eventsError
  if (upcomingError) throw upcomingError
  if (settlementsError) throw settlementsError

  return {
    promoter_id: promoterId,
    promoter_name: promoter!.name,
    assigned_events_count: assignedCount ?? 0,
    upcoming_events_count: upcomingCount ?? 0,
    referred_entries_count: referredCount,
    pending_settlements_count: pendingCount ?? 0,
  }
}

export async function listAssignedEvents(
  profile: Profile
): Promise<PromoterAssignedEvent[]> {
  const isOwner = isSystemOwnerRole(profile.role)
  const promoter = isOwner ? null : await getPromoterForUser(profile.id)

  if (!isOwner && !promoter) return []

  const supabase = createAdminClient()
  let query = supabase
    .from('events')
    .select('id, name, venue, event_date, status, event_type, promoter_id')
    .is('deleted_at', null)
    .order('event_date', { ascending: false })

  if (!isOwner && promoter) {
    query = query.eq('promoter_id', promoter.id)
  }

  const { data, error } = await query
  if (error) throw error

  const events = data ?? []
  const counts = await Promise.all(
    events.map(async (event) => {
      if (!promoter && !isOwner) return 0
      if (isOwner && event.promoter_id) {
        return countReferredEntries(event.promoter_id as string, event.id as string)
      }
      if (promoter) {
        return countReferredEntries(promoter.id, event.id as string)
      }
      return 0
    })
  )

  return events.map((event, index) => ({
    id: event.id as string,
    name: event.name as string,
    venue: event.venue as string,
    event_date: event.event_date as string,
    status: event.status as PromoterAssignedEvent['status'],
    event_type: event.event_type as PromoterAssignedEvent['event_type'],
    referred_entries_count: counts[index] ?? 0,
  }))
}

export async function getEventSummaryForPromoter(
  profile: Profile,
  eventId: string
): Promise<PromoterEventSummary | null> {
  const access = await assertPromoterEventAccess(profile, eventId)
  const supabase = createAdminClient()

  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('id, name, venue, event_date, status, promoter_id')
    .eq('id', eventId)
    .is('deleted_at', null)
    .maybeSingle()

  if (eventError) throw eventError
  if (!event) return null

  const promoterId =
    access.promoterId ?? (event.promoter_id as string | null) ?? null

  const [referredCount, standings, settlementResult] = await Promise.all([
    promoterId ? countReferredEntries(promoterId, eventId) : Promise.resolve(0),
    listStandingsForEvent(eventId),
    promoterId
      ? supabase
          .from('promoter_settlements')
          .select(
            `
            id,
            settlement_reference,
            gross_collection,
            eligible_collection,
            total_expenses,
            prize_pool,
            promoter_commission,
            amount_payable,
            amount_receivable,
            settlement_status,
            settled_at
          `
          )
          .eq('event_id', eventId)
          .eq('promoter_id', promoterId)
          .maybeSingle()
      : supabase
          .from('promoter_settlements')
          .select(
            `
            id,
            settlement_reference,
            gross_collection,
            eligible_collection,
            total_expenses,
            prize_pool,
            promoter_commission,
            amount_payable,
            amount_receivable,
            settlement_status,
            settled_at
          `
          )
          .eq('event_id', eventId)
          .limit(1)
          .maybeSingle(),
  ])

  if (settlementResult.error) throw settlementResult.error

  return {
    event: {
      id: event.id as string,
      name: event.name as string,
      venue: event.venue as string,
      event_date: event.event_date as string,
      status: event.status as PromoterEventSummary['event']['status'],
    },
    referred_entries_count: referredCount,
    standings,
    settlement: settlementResult.data
      ? mapSettlement(settlementResult.data as Record<string, unknown>)
      : null,
  }
}
