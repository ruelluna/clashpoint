'use client'

import { useEffect } from 'react'

import type { MatchActionState } from '@/features/matches/actions'
import { useMatchingLiveSync } from '@/features/matches/components/matching-live-sync-provider'
import { broadcastSettlementUpdated } from '@/features/matches/matching-cross-tab-sync'

export function useSettlementActionRefresh(
  eventId: string,
  matchId: string,
  state: MatchActionState
) {
  const { refreshSettlingMatch } = useMatchingLiveSync()

  useEffect(() => {
    if (!state.success) return

    void refreshSettlingMatch(matchId)
    broadcastSettlementUpdated(eventId, matchId)
  }, [eventId, matchId, refreshSettlingMatch, state.success])
}
