import type { ClassificationType, PairingStatus } from '@/lib/derby/enums'

export type EventPairingRuleRow = {
  id: string
  event_id: string
  classification_type: ClassificationType
  first_value: string
  second_value: string
  pairing_status: PairingStatus
  notes: string | null
  created_by: string | null
  updated_by: string | null
  created_at: string
  updated_at: string
}

export type PairingLookupInput = {
  eventId: string
  classificationType: ClassificationType
  firstValue: string
  secondValue: string
}
