import { describe, expect, it } from 'vitest'

import { calculateExperienceFromFights } from '@/features/roosters/experience'

describe('calculateExperienceFromFights', () => {
  it('returns maiden when there are no fights', () => {
    expect(calculateExperienceFromFights({ totalFights: 0, wins: 0 })).toBe('maiden')
  })

  it('returns winless when there are fights but no wins', () => {
    expect(calculateExperienceFromFights({ totalFights: 3, wins: 0 })).toBe('winless')
  })

  it('returns one_time_winner for a single win', () => {
    expect(calculateExperienceFromFights({ totalFights: 2, wins: 1 })).toBe('one_time_winner')
  })

  it('returns multi_winner for three or more wins', () => {
    expect(calculateExperienceFromFights({ totalFights: 8, wins: 4 })).toBe('multi_winner')
  })
})
