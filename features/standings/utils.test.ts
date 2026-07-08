import { describe, expect, it } from 'vitest'

import type { EntryFightStats } from '@/features/standings/types'
import {
  compareStandings,
  detectTiedGroups,
  pointsForOutcome,
  POINTS_DRAW,
  POINTS_LOSS,
  POINTS_WIN,
  rankStandings,
} from '@/features/standings/utils'

function stats(
  entryId: string,
  wins: number,
  losses: number,
  draws: number
): EntryFightStats {
  const points = wins * POINTS_WIN + draws * POINTS_DRAW + losses * POINTS_LOSS
  return {
    entryId,
    totalFights: wins + losses + draws,
    wins,
    losses,
    draws,
    points,
  }
}

describe('pointsForOutcome', () => {
  it('awards 1 point for a win', () => {
    expect(pointsForOutcome('win')).toBe(1)
  })

  it('awards 0.5 points for a draw', () => {
    expect(pointsForOutcome('draw')).toBe(0.5)
  })

  it('awards 0 points for a loss', () => {
    expect(pointsForOutcome('loss')).toBe(0)
  })
})

describe('compareStandings', () => {
  it('ranks higher points first', () => {
    expect(compareStandings(stats('a', 2, 0, 0), stats('b', 1, 0, 0))).toBeLessThan(0)
  })

  it('breaks ties on wins when points are equal', () => {
    const threeWins = stats('a', 3, 2, 0)
    const twoWins = stats('b', 2, 1, 0)
    expect(compareStandings(threeWins, twoWins)).toBeLessThan(0)
  })
})

describe('rankStandings', () => {
  it('orders by points then wins', () => {
    const ranked = rankStandings([
      stats('c', 1, 2, 0),
      stats('a', 3, 0, 0),
      stats('b', 2, 1, 0),
    ])

    expect(ranked.map((row) => row.entryId)).toEqual(['a', 'b', 'c'])
    expect(ranked.map((row) => row.rank)).toEqual([1, 2, 3])
  })

  it('assigns the same rank to tied entries', () => {
    const ranked = rankStandings([
      stats('a', 2, 1, 0),
      stats('b', 2, 1, 0),
      stats('c', 1, 2, 0),
    ])

    expect(ranked[0].rank).toBe(1)
    expect(ranked[1].rank).toBe(1)
    expect(ranked[0].isTied).toBe(true)
    expect(ranked[1].isTied).toBe(true)
    expect(ranked[2].rank).toBe(3)
  })

  it('treats equal points from draws as a tie', () => {
    const ranked = rankStandings([
      stats('a', 0, 0, 2),
      stats('b', 1, 1, 0),
    ])

    expect(ranked[0].entryId).toBe('b')
    expect(ranked[1].entryId).toBe('a')
    expect(ranked[1].points).toBe(1)
  })
})

describe('detectTiedGroups', () => {
  it('returns groups with more than one entry', () => {
    const ranked = rankStandings([
      stats('a', 2, 1, 0),
      stats('b', 2, 1, 0),
      stats('c', 1, 2, 0),
    ])

    expect(detectTiedGroups(ranked)).toEqual([
      { rank: 1, entryIds: ['a', 'b'] },
    ])
  })

  it('returns empty when no ties exist', () => {
    const ranked = rankStandings([
      stats('a', 3, 0, 0),
      stats('b', 2, 1, 0),
    ])

    expect(detectTiedGroups(ranked)).toEqual([])
  })
})
