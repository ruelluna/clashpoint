export type StandingStatus = 'active' | 'eliminated' | 'completed'

export type StandingRow = {
  id: string
  event_id: string
  entry_id: string
  total_fights: number
  wins: number
  losses: number
  draws: number
  points: number
  rank: number | null
  status: StandingStatus
  updated_at: string
}

export type StandingListItem = StandingRow & {
  entry_number: string
  entry_name: string
  owner_name: string
  is_tied: boolean
}

export type EntryFightStats = {
  entryId: string
  totalFights: number
  wins: number
  losses: number
  draws: number
  points: number
}

export type RankedStanding = EntryFightStats & {
  rank: number
  isTied: boolean
}
