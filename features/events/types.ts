export type EventType = 'classic' | 'derby'

export type EventStatus =
  | 'draft'
  | 'open'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'archived'

export type DerbyFormat = '2_cock' | '3_cock' | '4_cock' | '5_cock' | 'custom'

/** @deprecated Use DerbyFormat — kept for backward-compatible UI field names */
export type DerbyType = DerbyFormat

export type DerbyAgeType =
  | 'stag_derby'
  | 'bullstag_derby'
  | 'cock_derby'
  | 'stag_cock_derby'
  | 'cock_bullstag_derby'
  | 'stag_bullstag_cock_combo'
  | 'open_derby'
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
  /** Derby format (2-cock, 3-cock, etc.) — DB column derby_format */
  derby_type: DerbyFormat | null
  derby_age_type: DerbyAgeType | null
  require_rooster_entry_approval: boolean
  eligibility_enforcement_enabled: boolean
  classification_matching_enabled: boolean
  min_weight_grams: number | null
  max_weight_grams: number | null
  match_weight_tolerance_grams: number | null
  entry_fee: number
  registration_fee_enabled: boolean
  registration_fee_amount: number
  rooster_entry_fee_enabled: boolean
  rooster_entry_fee_amount: number
  cash_bond_enabled: boolean
  cash_bond_amount: number
  tax_per_fight: number
  tax_commission: number
  physical_inspection_required: boolean
  revolving_fund_initial: number
  cashier_opening_float_default: number
  min_entries: number | null
  max_entries: number | null
  cocks_per_entry: number
  min_weight: number | null
  max_weight: number | null
  scoring_system: ScoringSystem
  draw_rule: string
  tie_breaker_rule: string
  status: EventStatus
  is_active: boolean
  guaranteed_prize_amount: number | null
  house_deduction: number | null
  venue_share: number | null
  registration_rules: string | null
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
  | 'derby_type'
  | 'derby_age_type'
  | 'status'
  | 'is_active'
  | 'entry_fee'
  | 'tax_per_fight'
  | 'is_public'
> & {
  promoter_name: string | null
}

export type ActiveEventNavItem = {
  id: string
  name: string
}
