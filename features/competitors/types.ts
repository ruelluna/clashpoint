export type CompetitorRow = {
  id: string
  display_name: string
  contact_number: string | null
  email: string | null
  address: string | null
  competitor_level: string
  notes: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export type CompetitorSearchResult = {
  id: string
  displayName: string
  contactNumber: string | null
  email: string | null
  address: string | null
}

export type CompetitorOwnerProfile = {
  displayName: string
  contactNumber?: string
  email?: string
  address?: string
}
