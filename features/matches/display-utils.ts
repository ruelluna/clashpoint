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
    case 'queued':
      return 'purple'
    case 'at_pit':
    case 'fighting':
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
    case 'waiting':
      return 'gray'
    case 'handlers_called':
      return 'blue'
    case 'birds_at_pit':
      return 'orange'
    case 'fighting':
      return 'green'
    default:
      return 'purple'
  }
}
