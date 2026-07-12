export type EventReportType =
  | 'event_summary'
  | 'registration'
  | 'weighing'
  | 'match'
  | 'result'
  | 'audit'
  | 'entry_approval'
  | 'eligibility_summary'
  | 'classification_exceptions'
  | 'band_verification'

export type GlobalReportType = 'promoter' | 'audit'

export type ReportType = EventReportType | GlobalReportType

export type CsvRow = Record<string, string | number | boolean | null>

export type EventSummaryReportRow = {
  event_name: string
  venue: string
  event_date: string
  status: string
  event_type: string
  derby_type: string
  total_entries: number
  total_matches: number
  completed_matches: number
  total_roosters: number
  verified_weighings: number
}

export type RegistrationReportRow = {
  entry_number: string
  entry_name: string
  owner_name: string
  handler_name: string | null
  contact_number: string | null
  entry_source: string
  promoter_name: string | null
  registered_at: string
}

export type WeighingReportRow = {
  entry_number: string
  entry_name: string
  cock_number: number
  band_number: string
  declared_weight: number | null
  official_weight: number | null
  weight_status: string
  verified_at: string | null
  notes: string | null
}

export type MatchReportRow = {
  fight_number: number
  round_number: number | null
  status: string
  queue_status: string | null
  meron_entry_number: string
  meron_entry_name: string
  meron_cock_number: number
  meron_band_number: string
  meron_weight: number | null
  wala_entry_number: string
  wala_entry_name: string
  wala_cock_number: number
  wala_band_number: string
  wala_weight: number | null
}

export type ResultReportRow = {
  fight_number: number
  result_type: string
  winning_side: string | null
  meron_entry_name: string
  wala_entry_name: string
  result_status: string
  under_protest: boolean
  result_time: string | null
  notes: string | null
  recorded_at: string
}

export type FinancialReportRow = {
  payment_reference: string
  entry_number: string
  entry_name: string
  owner_name: string
  amount_due: number
  amount_paid: number
  balance: number
  payment_method: string | null
  receipt_number: string | null
  payment_status: string
  paid_at: string | null
  notes: string | null
}

export type PromoterReportRow = {
  promoter_id: string
  promoter_name: string
  status: string
  contact_person: string | null
  email: string | null
  phone: string | null
  commission_type: string
  commission_value: number | null
  events_hosted: number
  entries_referred: number
  total_collected: number
}

export type EntryApprovalReportRow = {
  event_name: string
  entry_name: string
  rooster_code: string
  band_number: string
  registration_status: string
  eligibility_status: string
  approval_status: string
  submitted_at: string | null
  approved_at: string | null
  rejection_reason: string | null
}

export type EligibilitySummaryReportRow = {
  metric: string
  count: number
}

export type ClassificationExceptionReportRow = {
  event_name: string
  first_entry: string
  second_entry: string
  original_result: string
  override_reason: string
  requested_by: string | null
  approved_by: string | null
  created_at: string
}

export type BandVerificationReportRow = {
  rooster_code: string
  entry_name: string
  band_organization: string | null
  band_number: string
  verification_status: string
  duplicate_warning: string
}

export type AuditReportRow = {
  created_at: string
  action: string
  entity_type: string
  entity_id: string
  actor_id: string | null
}
