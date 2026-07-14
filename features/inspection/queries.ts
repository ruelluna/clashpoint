import 'server-only'

import type { InspectionStatus } from '@/lib/derby/enums'
import type { EligibilityStatus, RegistrationWorkflowStatus } from '@/lib/derby/enums'
import type { WeightStatus } from '@/features/weighing/types'
import { createClient } from '@/lib/supabase/server'

export type InspectionQueueItem = {
  registrationId: string
  entryId: string
  entryNumber: string
  entryName: string
  bandNumber: string
  cockNumber: number
  inspectionStatus: InspectionStatus
  inspectionId: string | null
  inspectedAt: string | null
  notes: string | null
  declaredWeight: number | null
  officialWeight: number | null
  weightVerified: boolean
  weighingId: string | null
  weightStatus: WeightStatus | null
  weightVerifiedAt: string | null
  eligibilityStatus: EligibilityStatus
  registrationStatus: RegistrationWorkflowStatus
}

type InspectionQueueRow = {
  id: string
  entry_id: string
  cock_number: number
  band_number: string
  inspection_status: InspectionStatus
  declared_weight: number | null
  weight_verified: boolean | null
  eligibility_status: EligibilityStatus
  registration_status: RegistrationWorkflowStatus
  entries: { entry_number: string; entry_name: string } | null
  physical_inspections:
    | {
        id: string
        inspection_status: InspectionStatus
        notes: string | null
        inspected_at: string | null
      }
    | Array<{
        id: string
        inspection_status: InspectionStatus
        notes: string | null
        inspected_at: string | null
      }>
    | null
  weighings:
    | {
        id: string
        official_weight: number | null
        weight_status: WeightStatus
        verified_at: string | null
      }
    | Array<{
        id: string
        official_weight: number | null
        weight_status: WeightStatus
        verified_at: string | null
      }>
    | null
}

export async function listInspectionQueue(eventId: string): Promise<InspectionQueueItem[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('rooster_event_registrations')
    .select(
      `
      id,
      entry_id,
      cock_number,
      band_number,
      inspection_status,
      declared_weight,
      weight_verified,
      eligibility_status,
      registration_status,
      entries ( entry_number, entry_name ),
      physical_inspections (
        id,
        inspection_status,
        notes,
        inspected_at
      ),
      weighings (
        id,
        official_weight,
        weight_status,
        verified_at
      )
    `
    )
    .eq('event_id', eventId)
    .order('cock_number', { ascending: true })

  if (error) throw error

  return ((data ?? []) as unknown as InspectionQueueRow[]).map((row) => {
    const entry = row.entries
    const inspectionRaw = row.physical_inspections
    const inspection = Array.isArray(inspectionRaw)
      ? inspectionRaw[0] ?? null
      : inspectionRaw
    const weighingRaw = row.weighings
    const weighing = Array.isArray(weighingRaw) ? weighingRaw[0] ?? null : weighingRaw

    return {
      registrationId: row.id,
      entryId: row.entry_id,
      entryNumber: entry?.entry_number ?? '',
      entryName: entry?.entry_name ?? '',
      bandNumber: row.band_number,
      cockNumber: row.cock_number,
      inspectionStatus: row.inspection_status,
      inspectionId: inspection?.id ?? null,
      inspectedAt: inspection?.inspected_at ?? null,
      notes: inspection?.notes ?? null,
      declaredWeight: row.declared_weight != null ? Number(row.declared_weight) : null,
      officialWeight:
        weighing?.official_weight != null ? Number(weighing.official_weight) : null,
      weightVerified: Boolean(row.weight_verified),
      weighingId: weighing?.id ?? null,
      weightStatus: weighing?.weight_status ?? null,
      weightVerifiedAt: weighing?.verified_at ?? null,
      eligibilityStatus: row.eligibility_status,
      registrationStatus: row.registration_status,
    }
  })
}
