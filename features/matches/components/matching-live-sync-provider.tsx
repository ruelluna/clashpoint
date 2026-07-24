'use client'

import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'

import type { MatchListItem, SettlingMatchListItem } from '@/features/matches/types'
import { useEventMatchingRealtime } from '@/features/matches/hooks/use-event-matching-realtime'
import type { MatchingSyncMessage } from '@/features/matches/matching-cross-tab-sync'

type MatchingLiveSyncContextValue = {
  queueMatches: MatchListItem[]
  awaitingPaymentMatches: MatchListItem[]
  settlingMatches: SettlingMatchListItem[]
  refreshMatch: (matchId: string) => Promise<void>
  refreshSettlingMatch: (matchId: string) => Promise<void>
}

const MatchingLiveSyncContext = createContext<MatchingLiveSyncContextValue | null>(null)

type MatchingLiveSyncProviderProps = {
  eventId: string
  initialQueueMatches: MatchListItem[]
  initialAwaitingPaymentMatches: MatchListItem[]
  initialSettlingMatches: SettlingMatchListItem[]
  onPalitadaPitSync?: (message: MatchingSyncMessage) => void
  children: ReactNode
}

export function MatchingLiveSyncProvider({
  eventId,
  initialQueueMatches,
  initialAwaitingPaymentMatches,
  initialSettlingMatches,
  onPalitadaPitSync,
  children,
}: MatchingLiveSyncProviderProps) {
  const [queueMatches, setQueueMatches] = useState(initialQueueMatches)
  const [awaitingPaymentMatches, setAwaitingPaymentMatches] = useState(
    initialAwaitingPaymentMatches
  )
  const [settlingMatches, setSettlingMatches] = useState(initialSettlingMatches)

  const { refreshMatch, refreshSettlingMatch } = useEventMatchingRealtime({
    eventId,
    setQueueMatches,
    setAwaitingPaymentMatches,
    setSettlingMatches,
    onPalitadaPitSync,
  })

  const value = useMemo(
    () => ({
      queueMatches,
      awaitingPaymentMatches,
      settlingMatches,
      refreshMatch,
      refreshSettlingMatch,
    }),
    [queueMatches, awaitingPaymentMatches, settlingMatches, refreshMatch, refreshSettlingMatch]
  )

  return (
    <MatchingLiveSyncContext.Provider value={value}>{children}</MatchingLiveSyncContext.Provider>
  )
}

export function useMatchingLiveSync() {
  const context = useContext(MatchingLiveSyncContext)
  if (!context) {
    throw new Error('useMatchingLiveSync must be used within MatchingLiveSyncProvider')
  }
  return context
}
