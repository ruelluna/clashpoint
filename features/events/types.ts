export type EventType = 'house' | 'external_promoter' | 'sponsored' | 'test'

export type EventStatus =
  | 'draft'
  | 'open'
  | 'registration_closed'
  | 'ready_for_weighing'
  | 'ready_for_matching'
  | 'ongoing'
  | 'completed'
  | 'cancelled'
  | 'archived'

export type EventFormat = 'classic' | 'derby'

export type DerbyType =
  | '3_cock'
  | '4_cock'
  | '5_cock'
  | 'stag'
  | 'bullstag'
  | 'custom'

export type ScoringSystem = 'win_loss' | 'points'

export type PrizeType = 'percentage' | 'fixed' | 'manual'

export type PrizeConfigEntry = {
  place: number
  label: string
  value?: number
}

export type EventRow = {
  id: string
  promoter_id: string | null
  name: string
  venue: string
  event_date: string
  registration_deadline: string | null
  event_type: EventType
  event_format: EventFormat
  derby_type: DerbyType | null
  entry_fee: number
  min_entries: number | null
  max_entries: number | null
  cocks_per_entry: number
  min_weight: number | null
  max_weight: number | null
  scoring_system: ScoringSystem
  draw_rule: string
  tie_breaker_rule: string
  status: EventStatus
  guaranteed_prize_amount: number | null
  house_deduction: number | null
  venue_share: number | null
  legal_authorized: boolean
  is_public: boolean
  publish_matches: boolean
  publish_standings: boolean
  publish_winners: boolean
  publish_prize_amounts: boolean
  notes: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export type PrizeStructureRow = {
  id: string
  event_id: string
  prize_type: PrizeType
  config: PrizeConfigEntry[]
  created_at: string
  updated_at: string
}

export type EventWithPrize = EventRow & {
  prize_structure: PrizeStructureRow | null
  promoter_name: string | null
}

export type EventListItem = Pick<
  EventRow,
  | 'id'
  | 'name'
  | 'venue'
  | 'event_date'
  | 'event_type'
  | 'event_format'
  | 'derby_type'
  | 'status'
  | 'entry_fee'
  | 'is_public'
> & {
  promoter_name: string | null
}
