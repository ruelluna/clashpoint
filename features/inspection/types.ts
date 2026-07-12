import type { InspectionStatus } from '@/lib/derby/enums'

export type PhysicalInspectionRow = {
  id: string
  registration_id: string | null
  event_id: string
  inspection_status: InspectionStatus
  notes: string | null
  inspected_by: string | null
  inspected_at: string | null
  created_at: string
  updated_at: string
}
