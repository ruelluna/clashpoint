import type { EntryFightStats, RankedStanding } from '@/features/standings/types'

export const POINTS_WIN = 1
export const POINTS_DRAW = 0.5
export const POINTS_LOSS = 0

export function pointsForOutcome(outcome: 'win' | 'draw' | 'loss'): number {
  if (outcome === 'win') return POINTS_WIN
  if (outcome === 'draw') return POINTS_DRAW
  return POINTS_LOSS
}

export function compareStandings(a: EntryFightStats, b: EntryFightStats): number {
  if (b.points !== a.points) return b.points - a.points
  if (b.wins !== a.wins) return b.wins - a.wins
  return a.entryId.localeCompare(b.entryId)
}

export function rankStandings(stats: EntryFightStats[]): RankedStanding[] {
  if (stats.length === 0) return []

  const sorted = [...stats].sort(compareStandings)
  const ranked: RankedStanding[] = []

  for (let i = 0; i < sorted.length; i += 1) {
    const current = sorted[i]
    const previous = i > 0 ? sorted[i - 1] : null
    const sameAsPrevious =
      previous != null &&
      previous.points === current.points &&
      previous.wins === current.wins

    const rank = sameAsPrevious ? ranked[i - 1].rank : i + 1
    const next = i + 1 < sorted.length ? sorted[i + 1] : null
    const sameAsNext =
      next != null &&
      next.points === current.points &&
      next.wins === current.wins

    ranked.push({
      ...current,
      rank,
      isTied: sameAsPrevious || sameAsNext,
    })
  }

  return ranked
}

export function detectTiedGroups(
  ranked: RankedStanding[]
): Array<{ rank: number; entryIds: string[] }> {
  const groups = new Map<number, string[]>()

  for (const row of ranked) {
    if (!row.isTied) continue
    const existing = groups.get(row.rank) ?? []
    existing.push(row.entryId)
    groups.set(row.rank, existing)
  }

  return [...groups.entries()]
    .filter(([, entryIds]) => entryIds.length > 1)
    .map(([rank, entryIds]) => ({ rank, entryIds }))
}
