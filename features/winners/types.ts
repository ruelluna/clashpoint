export type EventFinalizationRow = {
  id: string
  event_id: string
  finalized_by: string | null
  finalized_at: string
  is_locked: boolean
  champion_entry_ids: string[]
  notes: string | null
}

export type WinnerListItem = {
  entryId: string
  entryNumber: string
  entryName: string
  ownerName: string
  rank: number
  points: number
  wins: number
  isChampion: boolean
  isTied: boolean
}

export type FinalizationSummary = {
  finalization: EventFinalizationRow | null
  winners: WinnerListItem[]
  tieBreakerRule: string
}
