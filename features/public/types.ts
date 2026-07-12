import type { DerbyType, EventStatus, EventType } from '@/features/events/types'
import type { MatchListItem } from '@/features/matches/types'

export type PublicEventListItem = {
  id: string
  name: string
  venue: string
  event_date: string
  event_type: EventType
  derby_type: DerbyType | null
  status: EventStatus
  promoter_name: string | null
}

export type PublicEvent = {
  id: string
  name: string
  venue: string
  event_date: string
  event_type: EventType
  derby_type: DerbyType | null
  status: EventStatus
  cocks_per_entry: number
  tax_per_fight: number
  registration_rules: string | null
  promoter_name: string | null
  publish_matches: boolean
  publish_standings: boolean
  publish_winners: boolean
  publish_prize_amounts: boolean
  registration_open?: boolean
}

export type PublicRegistrationEvent = {
  id: string
  name: string
  venue: string
  event_date: string
  event_type: EventType
  derby_type: DerbyType | null
  status: EventStatus
  cocks_per_entry: number
  tax_per_fight: number
  entry_fee: number
  registration_deadline: string | null
  registration_rules: string | null
  promoter_name: string | null
  require_rooster_entry_approval: boolean
  max_entries: number | null
  min_weight_grams: number | null
  max_weight_grams: number | null
  registration_open: boolean
}

export type PublicMatch = MatchListItem

export type PublicStanding = {
  id: string
  entry_id: string
  entry_number: string
  entry_name: string
  owner_name: string
  total_fights: number
  wins: number
  losses: number
  draws: number
  points: number
  rank: number | null
  status: string
  is_tied: boolean
}

export type PublicWinner = {
  id: string
  rank_label: string
  rank_position: number
  entry_name: string
  entry_number: string
  amount: number | null
}

export type PublicWinnersSummary = {
  finalized_at: string | null
  champions: Array<{
    entry_id: string
    entry_name: string
    entry_number: string
  }>
  payouts: PublicWinner[]
}
