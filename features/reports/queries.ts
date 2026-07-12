import 'server-only'

import { listEntriesByEvent } from '@/features/entries/queries'
import { getEvent } from '@/features/events/queries'
import { listMatchesByEvent } from '@/features/matches/queries'
import { listResultsForEvent } from '@/features/results/queries'
import type {
  AuditReportRow,
  BandVerificationReportRow,
  ClassificationExceptionReportRow,
  EligibilitySummaryReportRow,
  EntryApprovalReportRow,
  EventSummaryReportRow,
  MatchReportRow,
  PromoterReportRow,
  RegistrationReportRow,
  ResultReportRow,
  WeighingReportRow,
} from '@/features/reports/types'
import { listWeighingReport, countWeighingStats } from '@/features/weighing/queries'
import { createExtendedClient } from '@/lib/supabase/extended'
import { createClient } from '@/lib/supabase/server'

export async function getEventSummaryReport(
  eventId: string
): Promise<EventSummaryReportRow[]> {
  const supabase = await createClient()
  const event = await getEvent(eventId)
  if (!event) return []

  const [
    entriesResult,
    matchesResult,
    weighingStats,
    roosterCountResult,
  ] = await Promise.all([
    supabase
      .from('entries')
      .select('id', { count: 'exact' })
      .eq('event_id', eventId)
      .is('deleted_at', null),
    supabase.from('matches').select('status').eq('event_id', eventId),
    countWeighingStats(eventId),
    supabase
      .from('rooster_event_registrations')
      .select('id', { count: 'exact', head: true })
      .eq('event_id', eventId),
  ])

  if (entriesResult.error) throw entriesResult.error
  if (matchesResult.error) throw matchesResult.error
  if (roosterCountResult.error) throw roosterCountResult.error

  const entries = entriesResult.data ?? []
  const matches = matchesResult.data ?? []

  return [
    {
      event_name: event.name,
      venue: event.venue,
      event_date: event.event_date,
      status: event.status,
      event_type: event.event_type,
      derby_type: event.derby_type ?? '',
      total_entries: entriesResult.count ?? entries.length,
      total_matches: matches.length,
      completed_matches: matches.filter((row) => row.status === 'completed').length,
      total_roosters: roosterCountResult.count ?? weighingStats.total,
      verified_weighings: weighingStats.verified,
    },
  ]
}

export async function getRegistrationReport(
  eventId: string
): Promise<RegistrationReportRow[]> {
  const entries = await listEntriesByEvent(eventId)

  return entries.map((entry) => ({
    entry_number: entry.entry_number,
    entry_name: entry.entry_name,
    owner_name: entry.owner_name,
    handler_name: entry.handler_name,
    contact_number: entry.contact_number,
    entry_source: entry.entry_source,
    promoter_name: entry.promoter_name,
    registered_at: entry.created_at,
  }))
}

export async function getWeighingReport(eventId: string): Promise<WeighingReportRow[]> {
  const rows = await listWeighingReport(eventId)

  return rows.map((row) => ({
    entry_number: row.entry_number,
    entry_name: row.entry_name,
    cock_number: row.cock_number,
    band_number: row.band_number,
    declared_weight: row.declared_weight,
    official_weight: row.official_weight,
    weight_status: row.weight_status,
    verified_at: row.verified_at,
    notes: row.notes,
  }))
}

export async function getMatchReport(eventId: string): Promise<MatchReportRow[]> {
  const matches = await listMatchesByEvent(eventId)

  return matches.map((match) => ({
    fight_number: match.fight_number,
    round_number: match.round_number,
    status: match.status,
    queue_status: match.queue_status,
    meron_entry_number: match.meron.entry_number,
    meron_entry_name: match.meron.entry_name,
    meron_cock_number: match.meron.cock_number,
    meron_band_number: match.meron.band_number,
    meron_weight: match.meron.weight,
    wala_entry_number: match.wala.entry_number,
    wala_entry_name: match.wala.entry_name,
    wala_cock_number: match.wala.cock_number,
    wala_band_number: match.wala.band_number,
    wala_weight: match.wala.weight,
  }))
}

export async function getResultReport(eventId: string): Promise<ResultReportRow[]> {
  const results = await listResultsForEvent(eventId)

  return results.map((result) => ({
    fight_number: result.fight_number,
    result_type: result.result_type,
    winning_side: result.winning_side,
    meron_entry_name: result.meron_entry_name,
    wala_entry_name: result.wala_entry_name,
    result_status: result.result_status,
    under_protest: result.under_protest,
    result_time: result.result_time,
    notes: result.notes,
    recorded_at: result.created_at,
  }))
}

export async function getPromoterReport(): Promise<PromoterReportRow[]> {
  const supabase = await createClient()

  const { data: promoters, error: promotersError } = await supabase
    .from('promoters')
    .select(
      'id, name, status, contact_person, email, phone, commission_type, commission_value'
    )
    .is('deleted_at', null)
    .order('name', { ascending: true })

  if (promotersError) throw promotersError
  if (!promoters?.length) return []

  const promoterIds = promoters.map((row) => row.id as string)

  const [{ data: events, error: eventsError }, { data: entries, error: entriesError }] =
    await Promise.all([
      supabase
        .from('events')
        .select('id, promoter_id')
        .in('promoter_id', promoterIds)
        .is('deleted_at', null),
      supabase
        .from('entries')
        .select('id, referred_by_promoter_id')
        .in('referred_by_promoter_id', promoterIds)
        .is('deleted_at', null),
    ])

  if (eventsError) throw eventsError
  if (entriesError) throw entriesError

  const entryIdsByPromoter = new Map<string, string[]>()
  for (const entry of entries ?? []) {
    const promoterId = entry.referred_by_promoter_id as string
    const list = entryIdsByPromoter.get(promoterId) ?? []
    list.push(entry.id as string)
    entryIdsByPromoter.set(promoterId, list)
  }

  const eventsHostedByPromoter = new Map<string, number>()
  for (const event of events ?? []) {
    const promoterId = event.promoter_id as string
    eventsHostedByPromoter.set(promoterId, (eventsHostedByPromoter.get(promoterId) ?? 0) + 1)
  }

  const allReferredEntryIds = [...entryIdsByPromoter.values()].flat()
  const collectedByEntry = new Map<string, number>()

  if (allReferredEntryIds.length > 0) {
    const { data: payments, error: paymentsError } = await supabase
      .from('payments')
      .select('entry_id, amount_paid, payment_status')
      .in('entry_id', allReferredEntryIds)

    if (paymentsError) throw paymentsError

    for (const payment of payments ?? []) {
      if (payment.payment_status === 'refunded') continue
      const entryId = payment.entry_id as string
      collectedByEntry.set(
        entryId,
        (collectedByEntry.get(entryId) ?? 0) + Number(payment.amount_paid)
      )
    }
  }

  return promoters.map((promoter) => {
    const promoterId = promoter.id as string
    const referredEntryIds = entryIdsByPromoter.get(promoterId) ?? []
    const totalCollected = referredEntryIds.reduce(
      (sum, entryId) => sum + (collectedByEntry.get(entryId) ?? 0),
      0
    )

    return {
      promoter_id: promoterId,
      promoter_name: promoter.name as string,
      status: promoter.status as string,
      contact_person: (promoter.contact_person as string | null) ?? null,
      email: (promoter.email as string | null) ?? null,
      phone: (promoter.phone as string | null) ?? null,
      commission_type: promoter.commission_type as string,
      commission_value:
        promoter.commission_value != null ? Number(promoter.commission_value) : null,
      events_hosted: eventsHostedByPromoter.get(promoterId) ?? 0,
      entries_referred: referredEntryIds.length,
      total_collected: totalCollected,
    }
  })
}

export type AuditReportFilters = {
  eventId?: string
  entityType?: string
  limit?: number
}

export async function getAuditReport(
  filters: AuditReportFilters = {}
): Promise<AuditReportRow[]> {
  const supabase = await createClient()
  const limit = filters.limit ?? 500

  let query = supabase
    .from('audit_logs')
    .select('created_at, action, entity_type, entity_id, actor_id')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (filters.entityType) {
    query = query.eq('entity_type', filters.entityType)
  }

  if (filters.eventId) {
    query = query.in('entity_type', [
      'event',
      'entry',
      'rooster_event_registration',
      'match',
      'weighing',
      'rooster',
    ])
  }

  const { data, error } = await query
  if (error) throw error

  return (data ?? []).map((row) => ({
    created_at: row.created_at as string,
    action: row.action as string,
    entity_type: row.entity_type as string,
    entity_id: row.entity_id as string,
    actor_id: (row.actor_id as string | null) ?? null,
  }))
}

export async function getEntryApprovalReport(
  eventId: string
): Promise<EntryApprovalReportRow[]> {
  const event = await getEvent(eventId)
  if (!event) return []

  const supabase = await createExtendedClient()
  const { data, error } = await supabase
    .from('rooster_event_registrations')
    .select(
      `
      band_number,
      registration_status,
      eligibility_status,
      approval_status,
      submitted_at,
      approved_at,
      rejection_reason,
      entries ( entry_name ),
      roosters ( rooster_code )
    `
    )
    .eq('event_id', eventId)

  if (error) throw error

  return ((data ?? []) as Array<Record<string, unknown>>).map((row) => ({
    event_name: event.name,
    entry_name: (row.entries as { entry_name: string } | null)?.entry_name ?? '—',
    rooster_code: (row.roosters as { rooster_code: string } | null)?.rooster_code ?? '—',
    band_number: row.band_number as string,
    registration_status: row.registration_status as string,
    eligibility_status: row.eligibility_status as string,
    approval_status: row.approval_status as string,
    submitted_at: (row.submitted_at as string | null) ?? null,
    approved_at: (row.approved_at as string | null) ?? null,
    rejection_reason: (row.rejection_reason as string | null) ?? null,
  }))
}

export async function getEligibilitySummaryReport(
  eventId: string
): Promise<EligibilitySummaryReportRow[]> {
  const supabase = await createExtendedClient()
  const { data, error } = await supabase
    .from('rooster_event_registrations')
    .select('registration_status, eligibility_status, approval_status')
    .eq('event_id', eventId)

  if (error) throw error

  const counts = new Map<string, number>()
  for (const row of data ?? []) {
    for (const field of [
      `registration:${row.registration_status}`,
      `eligibility:${row.eligibility_status}`,
      `approval:${row.approval_status}`,
    ]) {
      counts.set(field, (counts.get(field) ?? 0) + 1)
    }
  }

  return [...counts.entries()].map(([metric, count]) => ({ metric, count }))
}

export async function getClassificationExceptionsReport(
  eventId: string
): Promise<ClassificationExceptionReportRow[]> {
  const event = await getEvent(eventId)
  if (!event) return []

  const supabase = await createExtendedClient()
  const { data, error } = await supabase
    .from('matchup_overrides')
    .select(
      'original_compatibility_result, override_reason, requested_by, approved_by, created_at, first_registration_id, second_registration_id'
    )
    .eq('event_id', eventId)
    .eq('status', 'approved')

  if (error) throw error

  return ((data ?? []) as Array<Record<string, unknown>>).map((row) => ({
    event_name: event.name,
    first_entry: String(row.first_registration_id),
    second_entry: String(row.second_registration_id),
    original_result: JSON.stringify(row.original_compatibility_result),
    override_reason: row.override_reason as string,
    requested_by: (row.requested_by as string | null) ?? null,
    approved_by: (row.approved_by as string | null) ?? null,
    created_at: row.created_at as string,
  }))
}

export async function getBandVerificationReport(
  eventId: string
): Promise<BandVerificationReportRow[]> {
  const supabase = await createExtendedClient()
  const { data, error } = await supabase
    .from('rooster_event_registrations')
    .select(
      `
      band_number,
      entries ( entry_name ),
      roosters (
        rooster_code,
        rooster_bands ( band_organization, band_number, verification_status )
      )
    `
    )
    .eq('event_id', eventId)

  if (error) throw error

  const rows: BandVerificationReportRow[] = []
  for (const item of (data ?? []) as Array<Record<string, unknown>>) {
    const rooster = item.roosters as {
      rooster_code: string
      rooster_bands: Array<{
        band_organization: string | null
        band_number: string
        verification_status: string
      }>
    } | null

    const bands = rooster?.rooster_bands ?? []
    if (bands.length === 0) {
      rows.push({
        rooster_code: rooster?.rooster_code ?? '—',
        entry_name: (item.entries as { entry_name: string } | null)?.entry_name ?? '—',
        band_organization: null,
        band_number: item.band_number as string,
        verification_status: 'unverified',
        duplicate_warning: '—',
      })
      continue
    }

    for (const band of bands) {
      rows.push({
        rooster_code: rooster?.rooster_code ?? '—',
        entry_name: (item.entries as { entry_name: string } | null)?.entry_name ?? '—',
        band_organization: band.band_organization,
        band_number: band.band_number,
        verification_status: band.verification_status,
        duplicate_warning: '—',
      })
    }
  }

  return rows
}
