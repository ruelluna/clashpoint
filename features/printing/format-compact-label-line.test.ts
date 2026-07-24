import { describe, expect, it } from 'vitest'

import {
  formatCockStickerHeadline,
  formatOwnerStickerHeadline,
  formatPledgeStickerHeadline,
  truncateCompactLabelLine,
} from '@/features/printing/format-compact-label-line'

describe('truncateCompactLabelLine', () => {
  it('returns short text unchanged', () => {
    expect(truncateCompactLabelLine('OWN · #1 · Juan')).toBe('OWN · #1 · Juan')
  })

  it('truncates long text with ellipsis', () => {
    const long = 'OWN · #12 · Very Long Owner Name That Exceeds Limit'
    const result = truncateCompactLabelLine(long, 28)
    expect(result.length).toBeLessThanOrEqual(28)
    expect(result.endsWith('…')).toBe(true)
  })
})

describe('sticker headline builders', () => {
  it('formats owner headline', () => {
    expect(formatOwnerStickerHeadline('12', 'Juan Dela Cruz')).toBe(
      'OWN · #12 · Juan Dela Cruz'
    )
  })

  it('formats cock headline as band number only', () => {
    expect(formatCockStickerHeadline('SEED-001-1')).toBe('SEED-001-1')
  })

  it('truncates long cock band numbers', () => {
    const result = formatCockStickerHeadline('SEED-009-VERY-LONG-BAND')
    expect(result.length).toBeLessThanOrEqual(18)
    expect(result.endsWith('…')).toBe(true)
  })

  it('formats pledge headline', () => {
    expect(formatPledgeStickerHeadline(5, 'MERON', '₱500.00')).toBe(
      'F5 · MERON · ₱500.00'
    )
  })
})
