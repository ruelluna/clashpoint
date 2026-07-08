export type LineupStatus = 'draft' | 'submitted' | 'verified' | 'rejected'

export type RoosterRecordRow = {
  id: string
  entry_id: string
  event_id: string
  cock_number: number
  band_number: string
  declared_weight: number | null
  category: string | null
  color_marking: string | null
  status: LineupStatus
  created_at: string
  updated_at: string
}

export type LineupEntrySummary = {
  entry_id: string
  entry_number: string
  entry_name: string
  owner_name: string
  can_submit: boolean
  rooster_count: number
  status: LineupStatus | null
}

export type LineupWithEntry = RoosterRecordRow & {
  entry_number: string
  entry_name: string
  owner_name: string
}
