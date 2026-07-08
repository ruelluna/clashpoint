import type { StandingListItem } from '@/features/standings/types'

export type TieBreakerRule =
  | 'shared_championship'
  | 'single_champion'
  | 'entry_number'
  | 'head_to_head'

export function normalizeTieBreakerRule(rule: string): TieBreakerRule {
  const normalized = rule.trim().toLowerCase().replace(/\s+/g, '_')

  if (
    normalized === 'shared_championship' ||
    normalized === 'shared' ||
    normalized === 'co_champions'
  ) {
    return 'shared_championship'
  }

  if (
    normalized === 'single_champion' ||
    normalized === 'one_champion' ||
    normalized === 'sudden_death'
  ) {
    return 'single_champion'
  }

  if (normalized === 'entry_number' || normalized === 'lowest_entry_number') {
    return 'entry_number'
  }

  if (normalized === 'head_to_head' || normalized === 'head-to-head') {
    return 'head_to_head'
  }

  return 'shared_championship'
}

export function resolveTopRankChampions(
  standings: StandingListItem[],
  tieBreakerRule: string
): { champions: StandingListItem[]; topRank: number | null } {
  if (standings.length === 0) return { champions: [], topRank: null }

  const ranked = standings.filter((row) => row.rank != null)
  if (ranked.length === 0) return { champions: [], topRank: null }

  const topRank = Math.min(...ranked.map((row) => row.rank as number))
  const topEntries = ranked.filter((row) => row.rank === topRank)

  if (topEntries.length <= 1) {
    return { champions: topEntries, topRank }
  }

  const rule = normalizeTieBreakerRule(tieBreakerRule)

  if (rule === 'shared_championship') {
    return { champions: topEntries, topRank }
  }

  if (rule === 'single_champion' || rule === 'entry_number') {
    const winner = [...topEntries].sort((a, b) =>
      a.entry_number.localeCompare(b.entry_number, undefined, { numeric: true })
    )[0]
    return { champions: winner ? [winner] : [], topRank }
  }

  if (rule === 'head_to_head') {
    const winner = [...topEntries].sort((a, b) => {
      if (b.wins !== a.wins) return b.wins - a.wins
      if (b.points !== a.points) return b.points - a.points
      return a.entry_number.localeCompare(b.entry_number, undefined, { numeric: true })
    })[0]
    return { champions: winner ? [winner] : [], topRank }
  }

  return { champions: topEntries, topRank }
}

export function buildWinnerListItems(
  standings: StandingListItem[],
  championEntryIds: string[]
): import('@/features/winners/types').WinnerListItem[] {
  const championSet = new Set(championEntryIds)

  return standings.map((row) => ({
    entryId: row.entry_id,
    entryNumber: row.entry_number,
    entryName: row.entry_name,
    ownerName: row.owner_name,
    rank: row.rank ?? 0,
    points: row.points,
    wins: row.wins,
    isChampion: championSet.has(row.entry_id),
    isTied: row.is_tied,
  }))
}

export function generateAnnouncementText(input: {
  eventName: string
  venue: string
  eventDate: string
  winners: Array<{
    label: string
    entryName: string
    entryNumber: string
    ownerName: string
    amount?: number | null
    showAmounts: boolean
  }>
  tieBreakerRule: string
  notes?: string | null
}): string {
  const dateLabel = new Date(input.eventDate).toLocaleDateString(undefined, {
    dateStyle: 'long',
  })

  const lines = [
    `${input.eventName}`,
    `${input.venue} · ${dateLabel}`,
    '',
    'OFFICIAL WINNERS',
    '',
  ]

  if (input.winners.length === 0) {
    lines.push('Winners have not been finalized yet.')
  } else {
    for (const winner of input.winners) {
      let line = `${winner.label}: #${winner.entryNumber} ${winner.entryName} (${winner.ownerName})`
      if (winner.showAmounts && winner.amount != null && winner.amount > 0) {
        line += ` — ₱${winner.amount.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`
      }
      lines.push(line)
    }
  }

  lines.push('')
  lines.push(`Tie-breaker: ${input.tieBreakerRule.replace(/_/g, ' ')}`)

  if (input.notes?.trim()) {
    lines.push('')
    lines.push(input.notes.trim())
  }

  return lines.join('\n')
}
