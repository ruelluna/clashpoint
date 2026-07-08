export type PromoterStatus = 'active' | 'inactive' | 'suspended'

export type CommissionType = 'none' | 'fixed' | 'percentage' | 'custom'

export type Promoter = {
  id: string
  user_id: string | null
  name: string
  contact_person: string | null
  phone: string | null
  email: string | null
  address: string | null
  status: PromoterStatus
  commission_type: CommissionType
  commission_value: number | null
  notes: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export type PromoterListItem = Pick<
  Promoter,
  | 'id'
  | 'name'
  | 'contact_person'
  | 'email'
  | 'phone'
  | 'status'
  | 'commission_type'
  | 'commission_value'
  | 'user_id'
  | 'created_at'
>

export type PromoterEventHistoryItem = {
  id: string
  name: string
  venue: string
  event_date: string
  status: string
  event_type: string
}
