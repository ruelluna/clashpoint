export type FightResultType =
  | 'meron_win'
  | 'wala_win'
  | 'draw'
  | 'no_contest'
  | 'disqualification'
  | 'cancelled'

export type ResultStatus = 'draft' | 'submitted' | 'verified' | 'final'

export type FightSide = 'meron' | 'wala'

export type FightResultRow = {
  id: string
  match_id: string
  event_id: string
  winning_side: FightSide | null
  result_type: FightResultType
  winning_entry_id: string | null
  losing_entry_id: string | null
  result_status: ResultStatus
  recorded_by: string | null
  verified_by: string | null
  result_time: string | null
  notes: string | null
  under_protest: boolean
  created_at: string
  updated_at: string
}

export type ResultListItem = FightResultRow & {
  fight_number: number
  meron_entry_name: string
  wala_entry_name: string
  meron_entry_id: string
  wala_entry_id: string
  match_status: string
  settlement_completed_at: string | null
  revolving_fund_complete: boolean
  vip_settlements: ResultVipSettlementItem[]
  handler_settlements: ResultHandlerSettlementItem[]
}

export type ResultHandlerSettlementItem = {
  name: string
  side: 'Meron' | 'Wala'
  betAmount: number
  winnings: number
  totalPayout: number
  paid_at: string | null
  status: 'pending' | 'posted' | 'paid'
  kind: 'win' | 'draw_refund'
}

export type ResultVipSettlementItem = {
  name: string
  action: 'Pay' | 'Collect' | 'Refund'
  amount: number
  paid_at: string | null
  status: 'pending' | 'posted' | 'paid'
}

export type MatchForResult = {
  id: string
  event_id: string
  fight_number: number
  meron_entry_id: string
  wala_entry_id: string
  status: string
}
