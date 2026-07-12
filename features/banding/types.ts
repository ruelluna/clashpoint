import type { BandLevel, BandVerificationStatus } from '@/lib/derby/enums'

export type RoosterBandRecord = {
  id: string
  rooster_id: string
  band_level: BandLevel
  band_organization: string | null
  band_number: string
  band_year: number | null
  band_season: string | null
  band_location: string | null
  band_color: string | null
  verification_status: BandVerificationStatus
  verification_notes: string | null
  proof_attachment: string | null
  verified_by: string | null
  verified_at: string | null
  created_at: string
  updated_at: string
}

export type BandDuplicateMatch = {
  bandId: string
  roosterId: string
  roosterCode: string | null
  bandOrganization: string | null
  bandNumber: string
  bandYear: number | null
  bandSeason: string | null
}
