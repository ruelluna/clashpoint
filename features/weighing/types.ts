export type WeightStatus = 'pending' | 'passed' | 'failed' | 'for_review'

export type WeighingRow = {
  id: string
  rooster_record_id: string
  entry_id: string
  event_id: string
  official_weight: number | null
  weight_status: WeightStatus
  verified_by: string | null
  verified_at: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export type WeighingStationItem = {
  rooster_record_id: string
  entry_id: string
  entry_number: string
  entry_name: string
  cock_number: number
  band_number: string
  declared_weight: number | null
  weighing_id: string | null
  official_weight: number | null
  weight_status: WeightStatus | null
  verified_at: string | null
}

export type WeighingReportRow = {
  id: string
  entry_number: string
  entry_name: string
  cock_number: number
  band_number: string
  declared_weight: number | null
  official_weight: number | null
  weight_status: WeightStatus
  verified_at: string | null
  notes: string | null
}
