import type { RevolvingFundLedgerEntry } from '@/features/revolving-fund/types'
import type { StatusColorPalette } from '@/lib/derby/status-colors'

export function revolvingFundEntryTypeColorPalette(
  entryType: RevolvingFundLedgerEntry['entryType']
): StatusColorPalette {
  switch (entryType) {
    case 'collection':
      return 'green'
    case 'refund':
      return 'red'
    case 'adjustment':
      return 'orange'
    case 'opening':
    default:
      return 'gray'
  }
}
