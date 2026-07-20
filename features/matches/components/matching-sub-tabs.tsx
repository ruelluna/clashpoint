'use client'

import { Badge, Box, Tabs } from '@chakra-ui/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useMemo } from 'react'

import { MatchingActiveMatchPanel } from '@/features/matches/components/matching-active-match-panel'
import { MatchingDeskPanel } from '@/features/matches/components/matching-desk-panel'
import { MatchingFightQueuePanel } from '@/features/matches/components/matching-fight-queue-panel'
import { MatchingPendingPaymentsPanel } from '@/features/matches/components/matching-pending-payments-panel'
import type { EligibleRooster, MatchListItem } from '@/features/matches/types'
import { resolveActiveMatch } from '@/features/matches/utils'

export type MatchingView = 'active' | 'queue' | 'pending' | 'desk'

const MATCHING_VIEWS: MatchingView[] = ['active', 'queue', 'pending', 'desk']

const VIEW_LABELS: Record<MatchingView, string> = {
  active: 'Active Match',
  queue: 'Fight Queue',
  pending: 'Pending Payments',
  desk: 'Matching Desk',
}

function parseMatchingView(value: string | null): MatchingView {
  if (value && MATCHING_VIEWS.includes(value as MatchingView)) {
    return value as MatchingView
  }
  return 'active'
}

type MatchingSubTabsProps = {
  eventId: string
  awaitingPaymentMatches: MatchListItem[]
  queueMatches: MatchListItem[]
  eligibleRoosters: EligibleRooster[]
  verifiedResultMatchIds: string[]
  taxPerFight: number
  taxCommissionRate: number
  canManage: boolean
  canRecordResult: boolean
  onFeedback?: (message: string | null, isError: boolean) => void
}

export function MatchingSubTabs({
  eventId,
  awaitingPaymentMatches,
  queueMatches,
  eligibleRoosters,
  verifiedResultMatchIds,
  taxPerFight,
  taxCommissionRate,
  canManage,
  canRecordResult,
  onFeedback,
}: MatchingSubTabsProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const activeView = parseMatchingView(searchParams.get('view'))

  const visibleViews = useMemo(
    () => (canManage ? MATCHING_VIEWS : MATCHING_VIEWS.filter((view) => view !== 'desk')),
    [canManage]
  )

  const activeMatch = useMemo(() => resolveActiveMatch(queueMatches), [queueMatches])
  const verifiedResultSet = useMemo(
    () => new Set(verifiedResultMatchIds),
    [verifiedResultMatchIds]
  )

  const setView = useCallback(
    (view: MatchingView) => {
      const params = new URLSearchParams(searchParams.toString())
      if (view === 'active') {
        params.delete('view')
      } else {
        params.set('view', view)
      }
      const query = params.toString()
      router.replace(
        query
          ? `/dashboard/events/${eventId}/matching?${query}`
          : `/dashboard/events/${eventId}/matching`,
        { scroll: false }
      )
    },
    [eventId, router, searchParams]
  )

  const resolvedView = visibleViews.includes(activeView) ? activeView : 'active'

  return (
    <Tabs.Root
      value={resolvedView}
      variant="outline"
      size="sm"
      onValueChange={(details) => setView(details.value as MatchingView)}
    >
      <Box overflowX="auto">
        <Tabs.List minW="max-content" borderBottomWidth="1px" borderColor="border">
          {visibleViews.map((view) => (
            <Tabs.Trigger key={view} value={view}>
              {VIEW_LABELS[view]}
              {view === 'pending' && awaitingPaymentMatches.length > 0 ? (
                <Badge ml={2} size="sm" colorPalette="orange">
                  {awaitingPaymentMatches.length}
                </Badge>
              ) : null}
            </Tabs.Trigger>
          ))}
        </Tabs.List>
      </Box>

      <Tabs.Content value="active" pt={4}>
        <MatchingActiveMatchPanel
          eventId={eventId}
          activeMatch={activeMatch}
          taxPerFight={taxPerFight}
          taxCommissionRate={taxCommissionRate}
          canManage={canManage}
          canRecordResult={canRecordResult}
          hasVerifiedResult={
            activeMatch ? verifiedResultSet.has(activeMatch.id) : false
          }
          onOpenFightQueue={() => setView('queue')}
        />
      </Tabs.Content>

      <Tabs.Content value="queue" pt={4}>
        <MatchingFightQueuePanel
          eventId={eventId}
          queueMatches={queueMatches}
          canManage={canManage}
        />
      </Tabs.Content>

      <Tabs.Content value="pending" pt={4}>
        <MatchingPendingPaymentsPanel
          eventId={eventId}
          awaitingPaymentMatches={awaitingPaymentMatches}
          canManage={canManage}
        />
      </Tabs.Content>

      {canManage ? (
        <Tabs.Content value="desk" pt={4}>
          <MatchingDeskPanel
            eventId={eventId}
            eligibleRoosters={eligibleRoosters}
            canManage={canManage}
            onFeedback={onFeedback}
          />
        </Tabs.Content>
      ) : null}
    </Tabs.Root>
  )
}
