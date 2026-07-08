import type { EventStatus, EventType } from '@/features/events/types'
import type { StandingListItem } from '@/features/standings/types'

export type PromoterAssignedEvent = {
  id: string
  name: string
  venue: string
  event_date: string
  status: EventStatus
  event_type: EventType
  referred_entries_count: number
}

export type PromoterDashboardStats = {
  promoter_id: string | null
  promoter_name: string | null
  assigned_events_count: number
  upcoming_events_count: number
  referred_entries_count: number
  pending_settlements_count: number
}

export type PromoterSettlementSummary = {
  id: string
  settlement_reference: string
  gross_collection: number
  eligible_collection: number
  total_expenses: number
  prize_pool: number
  promoter_commission: number
  amount_payable: number
  amount_receivable: number
  settlement_status: string
  settled_at: string | null
}

export type PromoterEventSummary = {
  event: {
    id: string
    name: string
    venue: string
    event_date: string
    status: EventStatus
  }
  referred_entries_count: number
  standings: StandingListItem[]
  settlement: PromoterSettlementSummary | null
}
