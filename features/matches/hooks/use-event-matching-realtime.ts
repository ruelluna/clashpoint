'use client'

import { useCallback, useEffect, useLayoutEffect, useRef } from 'react'

import {
  patchMatchInList,
  patchSettlingMatchObligation,
  removeMatchFromList,
  removePalitadaContributionFromMatch,
  removeSettlingMatch,
} from '@/features/matches/matching-realtime-patches'
import type { MatchListItem, SettlingMatchListItem } from '@/features/matches/types'
import { fetchMatchListItemClient } from '@/features/matches/client-queries'
import {
  subscribeMatchingCrossTabMessages,
  type MatchingSyncMessage,
} from '@/features/matches/matching-cross-tab-sync'
import { createClient } from '@/lib/supabase/client'

type UseEventMatchingRealtimeOptions = {
  eventId: string
  setQueueMatches: React.Dispatch<React.SetStateAction<MatchListItem[]>>
  setAwaitingPaymentMatches: React.Dispatch<React.SetStateAction<MatchListItem[]>>
  setSettlingMatches: React.Dispatch<React.SetStateAction<SettlingMatchListItem[]>>
}

const QUEUE_MATCH_STATUSES: MatchListItem['status'][] = [
  'queued',
  'at_pit',
  'fighting',
  'settling',
]

const AWAITING_PAYMENT_STATUSES: MatchListItem['status'][] = [
  'draft',
  'for_review',
  'confirmed',
]

function warnMatchingRealtime(message: string) {
  if (process.env.NODE_ENV === 'development') {
    console.warn(`[matching-realtime] ${message}`)
  }
}

export function useEventMatchingRealtime({
  eventId,
  setQueueMatches,
  setAwaitingPaymentMatches,
  setSettlingMatches,
}: UseEventMatchingRealtimeOptions) {
  const refreshGenerationRef = useRef(0)
  const refreshTimersRef = useRef(new Map<string, ReturnType<typeof setTimeout>>())
  const recentlyRemovedContributionsRef = useRef(new Set<string>())
  const isMountedRef = useRef(false)

  const setQueueMatchesRef = useRef(setQueueMatches)
  const setAwaitingPaymentMatchesRef = useRef(setAwaitingPaymentMatches)
  const setSettlingMatchesRef = useRef(setSettlingMatches)
  const eventIdRef = useRef(eventId)

  useLayoutEffect(() => {
    setQueueMatchesRef.current = setQueueMatches
    setAwaitingPaymentMatchesRef.current = setAwaitingPaymentMatches
    setSettlingMatchesRef.current = setSettlingMatches
    eventIdRef.current = eventId
  })

  const markContributionRemoved = useCallback((contributionId: string) => {
    recentlyRemovedContributionsRef.current.add(contributionId)
    window.setTimeout(() => {
      recentlyRemovedContributionsRef.current.delete(contributionId)
    }, 5000)
  }, [])

  const applyMatchRefresh = useCallback((match: MatchListItem, matchId: string) => {
    if (!isMountedRef.current) return

    const removedIds = recentlyRemovedContributionsRef.current
    const sanitizedMatch =
      removedIds.size === 0
        ? match
        : {
            ...match,
            meron_palitada: match.meron_palitada.filter(
              (contributor) => !removedIds.has(contributor.id)
            ),
            wala_palitada: match.wala_palitada.filter(
              (contributor) => !removedIds.has(contributor.id)
            ),
          }

    setQueueMatchesRef.current((current) => {
      const inQueue =
        QUEUE_MATCH_STATUSES.includes(sanitizedMatch.status) &&
        sanitizedMatch.queue_status != null
      if (!inQueue) return removeMatchFromList(current, matchId)
      return patchMatchInList(current, sanitizedMatch)
    })

    setAwaitingPaymentMatchesRef.current((current) => {
      const awaiting = AWAITING_PAYMENT_STATUSES.includes(sanitizedMatch.status)
      if (!awaiting) return removeMatchFromList(current, matchId)
      return patchMatchInList(current, sanitizedMatch)
    })

    if (sanitizedMatch.status === 'completed') {
      setSettlingMatchesRef.current((current) => removeSettlingMatch(current, matchId))
    }
  }, [])

  const refreshMatchRef = useRef<
    (matchId: string, source?: 'broadcast' | 'realtime' | 'local') => void
  >(() => undefined)

  useLayoutEffect(() => {
    refreshMatchRef.current = (matchId: string) => {
      const existingTimer = refreshTimersRef.current.get(matchId)
      if (existingTimer) clearTimeout(existingTimer)

      refreshTimersRef.current.set(
        matchId,
        setTimeout(async () => {
          refreshTimersRef.current.delete(matchId)
          if (!isMountedRef.current) return

          const generation = ++refreshGenerationRef.current
          const match = await fetchMatchListItemClient(eventIdRef.current, matchId)

          if (!isMountedRef.current) return
          if (generation !== refreshGenerationRef.current) return

          if (!match) {
            warnMatchingRealtime(
              `Failed to refresh match ${matchId} for event ${eventIdRef.current}`
            )
            return
          }

          applyMatchRefresh(match, matchId)
        }, 150)
      )
    }
  })

  const refreshMatch = useCallback(
    async (matchId: string, _source: 'broadcast' | 'realtime' | 'local' = 'local') => {
      refreshMatchRef.current(matchId, _source)
    },
    []
  )

  const handleSyncMessage = useCallback(
    (message: MatchingSyncMessage, _source: 'broadcast' | 'storage' | 'poll') => {
      if (!isMountedRef.current || message.eventId !== eventId) return

      if (
        message.action === 'palitada_removed' &&
        typeof message.contributionId === 'string'
      ) {
        markContributionRemoved(message.contributionId)
        setQueueMatchesRef.current((current) =>
          removePalitadaContributionFromMatch(
            current,
            message.matchId,
            message.contributionId!
          )
        )
        setAwaitingPaymentMatchesRef.current((current) =>
          removePalitadaContributionFromMatch(
            current,
            message.matchId,
            message.contributionId!
          )
        )
      }

      void refreshMatch(message.matchId, 'broadcast')
    },
    [eventId, markContributionRemoved, refreshMatch]
  )

  useLayoutEffect(() => {
    isMountedRef.current = true

    return () => {
      isMountedRef.current = false
    }
  }, [])

  useEffect(() => {
    return () => {
      for (const timer of refreshTimersRef.current.values()) {
        clearTimeout(timer)
      }
      refreshTimersRef.current.clear()
    }
  }, [])

  useEffect(() => {
    return subscribeMatchingCrossTabMessages({
      eventId,
      pollOnMount: true,
      onMessage: handleSyncMessage,
    })
  }, [eventId, handleSyncMessage])

  useEffect(() => {
    const supabase = createClient()
    let active = true

    const subscribeChannel = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!active) return

      if (session?.access_token) {
        supabase.realtime.setAuth(session.access_token)
      }

      const channel = supabase
        .channel(`event-matching:${eventId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'matches',
            filter: `event_id=eq.${eventId}`,
          },
          (payload) => {
            if (!isMountedRef.current) return

            const matchId =
              (payload.new as { id?: string } | null)?.id ??
              (payload.old as { id?: string } | null)?.id
            if (matchId) void refreshMatchRef.current(matchId, 'realtime')
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'match_bets',
            filter: `event_id=eq.${eventId}`,
          },
          (payload) => {
            if (!isMountedRef.current) return

            const matchId =
              (payload.new as { match_id?: string } | null)?.match_id ??
              (payload.old as { match_id?: string } | null)?.match_id
            if (matchId) void refreshMatchRef.current(matchId, 'realtime')
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'match_palitada_contributions',
            filter: `event_id=eq.${eventId}`,
          },
          (payload) => {
            if (!isMountedRef.current) return

            const matchId =
              (payload.new as { match_id?: string } | null)?.match_id ??
              (payload.old as { match_id?: string } | null)?.match_id

            if (payload.eventType === 'DELETE') {
              const deletedId = (payload.old as { id?: string } | null)?.id
              if (matchId && deletedId) {
                markContributionRemoved(deletedId)
                setQueueMatchesRef.current((current) =>
                  removePalitadaContributionFromMatch(current, matchId, deletedId)
                )
                setAwaitingPaymentMatchesRef.current((current) =>
                  removePalitadaContributionFromMatch(current, matchId, deletedId)
                )
              }
            }

            if (matchId) void refreshMatchRef.current(matchId, 'realtime')
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'match_settlement_obligations',
            filter: `event_id=eq.${eventId}`,
          },
          (payload) => {
            if (!isMountedRef.current) return

            const row = payload.new as SettlingMatchListItem['obligations'][number] | null
            if (!row?.match_id) return
            setSettlingMatchesRef.current((current) =>
              patchSettlingMatchObligation(current, row)
            )
          }
        )
        .subscribe((status) => {
          if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            warnMatchingRealtime(`channel event-matching:${eventId} ${status}`)
          }
        })

      return channel
    }

    const channelPromise = subscribeChannel()

    const {
      data: { subscription: authSubscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.access_token) {
        supabase.realtime.setAuth(session.access_token)
      }
    })

    return () => {
      active = false
      authSubscription.unsubscribe()
      void channelPromise.then((channel) => {
        if (channel) void supabase.removeChannel(channel)
      })
    }
  }, [eventId, markContributionRemoved])

  return { refreshMatch }
}
