import type { PromoterStatus } from '@/features/promoters/types'
import type { StatusColorPalette } from '@/lib/derby/status-colors'

export function promoterStatusColorPalette(status: PromoterStatus): StatusColorPalette {
  if (status === 'active') return 'green'
  if (status === 'suspended') return 'orange'
  return 'gray'
}
