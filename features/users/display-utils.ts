import type { AppRole } from '@/lib/auth/types'
import type { StatusColorPalette } from '@/lib/derby/status-colors'

export function roleColorPalette(role: AppRole): StatusColorPalette {
  switch (role) {
    case 'system_owner':
      return 'purple'
    case 'event_organizer':
      return 'blue'
    case 'admin':
      return 'red'
    case 'promoter':
      return 'teal'
    case 'staff':
    default:
      return 'gray'
  }
}
