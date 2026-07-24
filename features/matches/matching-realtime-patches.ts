import type {
  MatchListItem,
  MatchSettlementObligationItem,
  SettlingMatchListItem,
} from '@/features/matches/types'

export function patchMatchInList(
  matches: MatchListItem[],
  updated: MatchListItem
): MatchListItem[] {
  const index = matches.findIndex((match) => match.id === updated.id)
  if (index === -1) return [...matches, updated]
  const next = [...matches]
  next[index] = updated
  return next
}

export function removeMatchFromList(matches: MatchListItem[], matchId: string): MatchListItem[] {
  return matches.filter((match) => match.id !== matchId)
}

export function removePalitadaContributionFromMatch(
  matches: MatchListItem[],
  matchId: string,
  contributionId: string
): MatchListItem[] {
  return matches.map((match) => {
    if (match.id !== matchId) return match

    return {
      ...match,
      meron_palitada: match.meron_palitada.filter(
        (contributor) => contributor.id !== contributionId
      ),
      wala_palitada: match.wala_palitada.filter(
        (contributor) => contributor.id !== contributionId
      ),
    }
  })
}

export function patchSettlingMatchObligations(
  settlingMatches: SettlingMatchListItem[],
  matchId: string,
  obligations: MatchSettlementObligationItem[]
): SettlingMatchListItem[] {
  return settlingMatches.map((match) =>
    match.id === matchId ? { ...match, obligations } : match
  )
}

export function patchSettlingMatchObligation(
  settlingMatches: SettlingMatchListItem[],
  obligation: MatchSettlementObligationItem
): SettlingMatchListItem[] {
  return settlingMatches.map((match) => {
    if (match.id !== obligation.match_id) return match
    const obligations = match.obligations.some((row) => row.id === obligation.id)
      ? match.obligations.map((row) => (row.id === obligation.id ? obligation : row))
      : [...match.obligations, obligation].sort((a, b) => a.sort_order - b.sort_order)
    return { ...match, obligations }
  })
}

export function removeSettlingMatch(
  settlingMatches: SettlingMatchListItem[],
  matchId: string
): SettlingMatchListItem[] {
  return settlingMatches.filter((match) => match.id !== matchId)
}
