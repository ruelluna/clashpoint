import type { EventStatus } from '@/features/events/types'
import type { StatusColorPalette } from '@/lib/derby/status-colors'

export function eventStatusColorPalette(status: EventStatus): StatusColorPalette {
  switch (status) {
    case 'draft':
      return 'gray'
    case 'open':
      return 'green'
    case 'in_progress':
      return 'blue'
    case 'completed':
      return 'purple'
    case 'cancelled':
      return 'red'
    case 'archived':
      return 'orange'
    default:
      return 'yellow'
  }
}
