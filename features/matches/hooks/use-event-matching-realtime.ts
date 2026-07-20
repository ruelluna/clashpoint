'use client'

import { useCallback, useEffect } from 'react'

import {
  patchSettlingMatchObligation,
  removeSettlingMatch,
} from '@/features/matches/matching-realtime-patches'
import type { MatchListItem, SettlingMatchListItem } from '@/features/matches/types'
import { fetchMatchListItemClient } from '@/features/matches/client-queries'
import { createClient } from '@/lib/supabase/client'

type UseEventMatchingRealtimeOptions = {
  eventId: string
  setQueueMatches: React.Dispatch<React.SetStateAction<MatchListItem[]>>
  setAwaitingPaymentMatches: React.Dispatch<React.SetStateAction<MatchListItem[]>>
  setSettlingMatches: React.Dispatch<React.SetStateAction<SettlingMatchListItem[]>>
}

export function useEventMatchingRealtime({
  eventId,
  setQueueMatches,
  setAwaitingPaymentMatches,
  setSettlingMatches,
}: UseEventMatchingRealtimeOptions) {
  const refreshMatch = useCallback(
    async (matchId: string) => {
      const match = await fetchMatchListItemClient(eventId, matchId)
      if (!match) return

      setQueueMatches((current) => {
        const inQueue = ['queued', 'at_pit', 'fighting', 'settling'].includes(match.status)
        const filtered = current.filter((row) => row.id !== matchId)
        return inQueue && match.queue_status ? [...filtered, match] : filtered
      })

      setAwaitingPaymentMatches((current) => {
        const awaiting = ['draft', 'for_review', 'confirmed'].includes(match.status)
        const filtered = current.filter((row) => row.id !== matchId)
        return awaiting ? [...filtered, match] : filtered
      })

      if (match.status === 'completed') {
        setSettlingMatches((current) => removeSettlingMatch(current, matchId))
      }
    },
    [eventId, setAwaitingPaymentMatches, setQueueMatches, setSettlingMatches]
  )

  useEffect(() => {
    const supabase = createClient()

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
          const matchId = (payload.new as { id?: string } | null)?.id ??
            (payload.old as { id?: string } | null)?.id
          if (matchId) void refreshMatch(matchId)
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'match_bets',
        },
        (payload) => {
          const matchId = (payload.new as { match_id?: string } | null)?.match_id ??
            (payload.old as { match_id?: string } | null)?.match_id
          if (matchId) void refreshMatch(matchId)
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'match_palitada_contributions',
        },
        (payload) => {
          const matchId = (payload.new as { match_id?: string } | null)?.match_id ??
            (payload.old as { match_id?: string } | null)?.match_id
          if (matchId) void refreshMatch(matchId)
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
          const row = payload.new as SettlingMatchListItem['obligations'][number] | null
          if (!row?.match_id) return
          setSettlingMatches((current) => patchSettlingMatchObligation(current, row))
        }
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [eventId, refreshMatch, setSettlingMatches])

  return { refreshMatch }
}
