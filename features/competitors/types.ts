export type CompetitorRow = {
  id: string
  display_name: string
  contact_full_name: string | null
  contact_designation: string | null
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
  contactFullName: string | null
  contactDesignation: string | null
  contactNumber: string | null
  email: string | null
  address: string | null
}

export type CompetitorOwnerProfile = {
  displayName: string
  contactFullName?: string
  contactDesignation?: string
  contactNumber?: string
  email?: string
  address?: string
  notes?: string
}

export type CompetitorListItem = {
  id: string
  displayName: string
  contactFullName: string | null
  contactDesignation: string | null
  contactNumber: string | null
  email: string | null
  address: string | null
  notes: string | null
  createdAt: string
}

export type CompetitorDetail = CompetitorListItem
