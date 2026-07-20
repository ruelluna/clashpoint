import type { RegistrationStatus } from '@/features/entries/types'
import type { StatusColorPalette } from '@/lib/derby/status-colors'

export function entryRegistrationStatusColorPalette(
  status: RegistrationStatus
): StatusColorPalette {
  switch (status) {
    case 'approved':
    case 'confirmed':
      return 'green'
    case 'rejected':
    case 'cancelled':
      return 'red'
    case 'pending_review':
      return 'orange'
    case 'submitted':
    default:
      return 'gray'
  }
}
