import type { FightQueueStatus, MatchStatus } from '@/features/matches/types'
import type { StatusColorPalette } from '@/lib/derby/status-colors'

export function matchStatusColorPalette(status: MatchStatus): StatusColorPalette {
  switch (status) {
    case 'draft':
      return 'gray'
    case 'for_review':
      return 'orange'
    case 'confirmed':
      return 'blue'
    case 'locked':
      return 'purple'
    case 'ready':
    case 'ongoing':
      return 'green'
    case 'cancelled':
      return 'red'
    default:
      return 'gray'
  }
}

export function fightQueueStatusColorPalette(
  status: FightQueueStatus | null | undefined
): StatusColorPalette {
  switch (status) {
    case 'scheduled':
      return 'gray'
    case 'called':
      return 'blue'
    case 'ready':
      return 'orange'
    case 'ongoing':
      return 'green'
    default:
      return 'purple'
  }
}
