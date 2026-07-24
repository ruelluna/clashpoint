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
import {
  showPalitadaRecordedToast,
  showPalitadaRemovedToast,
} from '@/features/matches/palitada-sync-toast'
import { createClient } from '@/lib/supabase/client'

type UseEventMatchingRealtimeOptions = {
  eventId: string
  setQueueMatches: React.Dispatch<React.SetStateAction<MatchListItem[]>>
  setAwaitingPaymentMatches: React.Dispatch<React.SetStateAction<MatchListItem[]>>
  setSettlingMatches: React.Dispatch<React.SetStateAction<SettlingMatchListItem[]>>
  onPalitadaPitSync?: (message: MatchingSyncMessage) => void
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

function isMatchingBoardPath(pathname: string): boolean {
  return pathname.includes('/matching') && !pathname.endsWith('/matching/pit')
}

const DEFAULT_REFRESH_DEBOUNCE_MS = 150
const REMOVE_REFRESH_DEBOUNCE_MS = 300

export function useEventMatchingRealtime({
  eventId,
  setQueueMatches,
  setAwaitingPaymentMatches,
  setSettlingMatches,
  onPalitadaPitSync,
}: UseEventMatchingRealtimeOptions) {
  const refreshGenerationRef = useRef(0)
  const refreshTimersRef = useRef(new Map<string, ReturnType<typeof setTimeout>>())
  const recentlyRemovedContributionsRef = useRef(new Set<string>())
  const isMountedRef = useRef(false)
  const onPalitadaPitSyncRef = useRef(onPalitadaPitSync)
  const recentPalitadaNotificationsRef = useRef(new Map<string, number>())

  const setQueueMatchesRef = useRef(setQueueMatches)
  const setAwaitingPaymentMatchesRef = useRef(setAwaitingPaymentMatches)
  const setSettlingMatchesRef = useRef(setSettlingMatches)
  const eventIdRef = useRef(eventId)

  useLayoutEffect(() => {
    setQueueMatchesRef.current = setQueueMatches
    setAwaitingPaymentMatchesRef.current = setAwaitingPaymentMatches
    setSettlingMatchesRef.current = setSettlingMatches
    eventIdRef.current = eventId
    onPalitadaPitSyncRef.current = onPalitadaPitSync
  })

  const markContributionRemoved = useCallback((contributionId: string) => {
    recentlyRemovedContributionsRef.current.add(contributionId)
    window.setTimeout(() => {
      recentlyRemovedContributionsRef.current.delete(contributionId)
    }, 5000)
  }, [])

  const notifyPalitadaSync = useCallback((message: MatchingSyncMessage) => {
    if (message.action !== 'palitada_added' && message.action !== 'palitada_removed') {
      return
    }

    if (typeof window === 'undefined' || !isMatchingBoardPath(window.location.pathname)) {
      return
    }

    const dedupeKey = `${message.matchId}:${message.action}:${message.contributionId ?? 'none'}`
    const now = Date.now()
    const lastNotifiedAt = recentPalitadaNotificationsRef.current.get(dedupeKey)
    if (lastNotifiedAt != null && now - lastNotifiedAt < 500) {
      return
    }
    recentPalitadaNotificationsRef.current.set(dedupeKey, now)

    onPalitadaPitSyncRef.current?.(message)

    const fightLabel =
      message.fightNumber != null ? `Fight #${message.fightNumber}` : 'the open fight'

    window.setTimeout(() => {
      if (message.action === 'palitada_added') {
        showPalitadaRecordedToast(fightLabel)
        return
      }

      showPalitadaRemovedToast(fightLabel)
    }, 0)
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
    (matchId: string, options?: { debounceMs?: number }) => void
  >(() => undefined)

  useLayoutEffect(() => {
    refreshMatchRef.current = (matchId: string, options?: { debounceMs?: number }) => {
      const debounceMs = options?.debounceMs ?? DEFAULT_REFRESH_DEBOUNCE_MS
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
        }, debounceMs)
      )
    }
  })

  const refreshMatch = useCallback(
    async (
      matchId: string,
      _source: 'broadcast' | 'realtime' | 'local' = 'local',
      debounceMs = DEFAULT_REFRESH_DEBOUNCE_MS
    ) => {
      refreshMatchRef.current(matchId, { debounceMs })
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

      if (message.action === 'palitada_added' || message.action === 'palitada_removed') {
        notifyPalitadaSync(message)
      }

      const debounceMs =
        message.action === 'palitada_removed'
          ? REMOVE_REFRESH_DEBOUNCE_MS
          : DEFAULT_REFRESH_DEBOUNCE_MS
      void refreshMatch(message.matchId, 'broadcast', debounceMs)
    },
    [eventId, markContributionRemoved, notifyPalitadaSync, refreshMatch]
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
            if (matchId) void refreshMatchRef.current(matchId)
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
            if (matchId) void refreshMatchRef.current(matchId)
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
                notifyPalitadaSync({
                  eventId,
                  matchId,
                  action: 'palitada_removed',
                  contributionId: deletedId,
                })
              }
            }

            if (payload.eventType === 'INSERT' && matchId) {
              notifyPalitadaSync({
                eventId,
                matchId,
                action: 'palitada_added',
              })
            }

            if (matchId) {
              const debounceMs =
                payload.eventType === 'DELETE'
                  ? REMOVE_REFRESH_DEBOUNCE_MS
                  : DEFAULT_REFRESH_DEBOUNCE_MS
              refreshMatchRef.current(matchId, { debounceMs })
            }
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
  }, [eventId, markContributionRemoved, notifyPalitadaSync])

  return { refreshMatch }
}
