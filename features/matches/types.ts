export type MatchStatus =
  | 'draft'
  | 'for_review'
  | 'confirmed'
  | 'queued'
  | 'at_pit'
  | 'fighting'
  | 'completed'
  | 'cancelled'

export type FightQueueStatus =
  | 'waiting'
  | 'handlers_called'
  | 'birds_at_pit'
  | 'fighting'

export type MatchRow = {
  id: string
  event_id: string
  fight_number: number
  round_number: number | null
  meron_entry_id: string
  meron_rooster_id: string
  meron_weight: number | null
  wala_entry_id: string
  wala_rooster_id: string
  wala_weight: number | null
  status: MatchStatus
  queue_status: FightQueueStatus | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export type MatchBetPaymentStatus =
  | 'unpaid'
  | 'paid'
  | 'refunded'
  | 'waived'

export type MatchSideDetails = {
  entry_id: string
  entry_number: string
  entry_name: string
  owner_name: string
  rooster_id: string
  cock_number: number
  band_number: string
  weight: number | null
  bet_amount: number
  bet_collected_amount: number
  bet_barcode: string | null
  bet_payment_status: MatchBetPaymentStatus
}

export type MatchListItem = {
  id: string
  event_id: string
  fight_number: number
  round_number: number | null
  status: MatchStatus
  queue_status: FightQueueStatus | null
  meron: MatchSideDetails
  wala: MatchSideDetails
}

export type EligibleRooster = {
  rooster_id: string
  entry_id: string
  entry_number: string
  entry_name: string
  cock_number: number
  band_number: string
  cock_entry_barcode: string | null
  official_weight: number | null
  category: string | null
}

export type FightQueueSummary = {
  event_id: string
  event_name: string
  venue: string
  total_fights: number
  waiting_count: number
  handlers_called_count: number
  birds_at_pit_count: number
  fighting_count: number
  current_fight_number: number | null
}

export type RoosterEligibilityContext = {
  rooster_id: string
  entry_id: string
  event_id: string
  lineup_status: string
  weight_status: string | null
}
