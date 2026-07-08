export type RegistrationStatus =
  | 'submitted'
  | 'pending_review'
  | 'approved'
  | 'rejected'
  | 'cancelled'
  | 'confirmed'

export type PaymentStatus = 'unpaid' | 'partial' | 'paid' | 'refunded'

export type EntrySource =
  | 'walk_in'
  | 'online'
  | 'promoter_invite'
  | 'staff_encoded'

export type EntryRow = {
  id: string
  event_id: string
  referred_by_promoter_id: string | null
  entry_number: string
  entry_name: string
  owner_name: string
  handler_name: string | null
  contact_number: string | null
  email: string | null
  address: string | null
  entry_source: EntrySource
  registration_status: RegistrationStatus
  payment_status: PaymentStatus
  notes: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export type EntryListItem = Pick<
  EntryRow,
  | 'id'
  | 'entry_number'
  | 'entry_name'
  | 'owner_name'
  | 'handler_name'
  | 'contact_number'
  | 'entry_source'
  | 'registration_status'
  | 'payment_status'
  | 'created_at'
> & {
  promoter_name: string | null
}

export type EntryWithEvent = EntryRow & {
  event_name: string
  entry_fee: number
}
