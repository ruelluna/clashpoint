import type {
  AgeClass,
  BandLevel,
  BandVerificationStatus,
  BreedingRelationship,
  CompetitionClass,
  ExperienceStatus,
  OriginType,
} from '@/lib/derby/enums'

export type RoosterRow = {
  id: string
  rooster_code: string
  name: string | null
  competitor_id: string | null
  gamefarm_id: string | null
  breeder_id: string | null
  age_class: AgeClass
  hatch_date: string | null
  hatch_date_is_estimated: boolean
  annual_molt_status: string | null
  competition_class: CompetitionClass
  suggested_competition_class: CompetitionClass | null
  competition_class_assigned_by: string | null
  competition_class_assigned_at: string | null
  competition_class_notes: string | null
  breed: string | null
  bloodline: string | null
  sex: string | null
  declared_external_experience_status: ExperienceStatus | null
  calculated_experience_status: ExperienceStatus
  external_experience_notes: string | null
  external_experience_proof: string | null
  external_experience_verified_by: string | null
  external_experience_verified_at: string | null
  origin_type: OriginType
  country_of_origin: string | null
  province_of_origin: string | null
  municipality_of_origin: string | null
  breeder_name_external: string | null
  breeding_relationship: BreedingRelationship
  origin_verified: boolean
  origin_proof_attachment: string | null
  origin_notes: string | null
  created_by: string | null
  updated_by: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export type RoosterBandRow = {
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

export type RoosterWithBands = RoosterRow & {
  bands: RoosterBandRow[]
}

export type RoosterFightOutcome = {
  match_id: string
  event_id: string
  result_type: string
  won: boolean
  participated: boolean
}

export type RoosterListItem = Pick<
  RoosterRow,
  | 'id'
  | 'rooster_code'
  | 'name'
  | 'age_class'
  | 'competition_class'
  | 'calculated_experience_status'
  | 'origin_type'
  | 'created_at'
>

export type RoosterParticipationItem = {
  id: string
  event_id: string
  event_name: string
  entry_number: string
  entry_name: string
  cock_number: number
  band_number: string
  registration_status: string
  approval_status: string
  eligibility_status: string
  created_at: string
}
