import { describe, expect, it } from 'vitest'

import {
  formatBandNumberForDisplay,
  isInternalRegistrationBand,
  resolveRegistrationBandNumber,
} from '@/features/entries/band-display'

const entryId = '00000000-0000-4000-8000-000000000099'

describe('resolveRegistrationBandNumber', () => {
  it('returns trimmed band when provided', () => {
    expect(
      resolveRegistrationBandNumber({ bandNumber: ' B-101 ', entryId, cockNumber: 1 })
    ).toBe('B-101')
  })

  it('generates unique internal band when empty', () => {
    expect(resolveRegistrationBandNumber({ bandNumber: '', entryId, cockNumber: 2 })).toBe(
      'NB-00000000-2'
    )
  })
})

describe('formatBandNumberForDisplay', () => {
  it('hides internal placeholder bands', () => {
    expect(formatBandNumberForDisplay('NB-00000000-1')).toBe('—')
    expect(isInternalRegistrationBand('NB-00000000-1')).toBe(true)
  })

  it('shows real band numbers', () => {
    expect(formatBandNumberForDisplay('B-101')).toBe('B-101')
  })
})
