'use client'

import { Badge, Box, Tabs } from '@chakra-ui/react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef } from 'react'

import { MatchingActiveMatchPanel } from '@/features/matches/components/matching-active-match-panel'
import { MatchingDeskPanel } from '@/features/matches/components/matching-desk-panel'
import { MatchingFightQueuePanel } from '@/features/matches/components/matching-fight-queue-panel'
import { useMatchingLiveSync } from '@/features/matches/components/matching-live-sync-provider'
import { MatchingPendingPaymentsPanel } from '@/features/matches/components/matching-pending-payments-panel'
import { MatchingSettlingPanel } from '@/features/matches/components/matching-settling-panel'
import { subscribeMatchingCrossTabMessages } from '@/features/matches/matching-cross-tab-sync'
import {
  showPalitadaRecordedToast,
  showPalitadaRemovedToast,
} from '@/features/matches/palitada-sync-toast'
import type { EligibleRooster } from '@/features/matches/types'
import { resolveActiveMatch, resolveBetBalancingTargetMatch } from '@/features/matches/utils'

export type MatchingView = 'active' | 'queue' | 'pending' | 'desk' | 'settling'

const MATCHING_VIEWS: MatchingView[] = ['active', 'queue', 'pending', 'settling', 'desk']

const VIEW_LABELS: Record<MatchingView, string> = {
  active: 'Active Match',
  queue: 'Fight Queue',
  pending: 'Pending Payments',
  settling: 'Settling',
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
  eligibleRoosters: EligibleRooster[]
  verifiedResultMatchIds: string[]
  taxPerFight: number
  taxCommissionRate: number
  canManage: boolean
  canManagePalitada: boolean
  canManageQueueOverride: boolean
  canSettle: boolean
  canRecordResult: boolean
  onFeedback?: (message: string | null, isError: boolean) => void
}

export function MatchingSubTabs({
  eventId,
  eligibleRoosters,
  verifiedResultMatchIds,
  taxPerFight,
  taxCommissionRate,
  canManage,
  canManagePalitada,
  canManageQueueOverride,
  canSettle,
  canRecordResult,
  onFeedback,
}: MatchingSubTabsProps) {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const activeView = parseMatchingView(searchParams.get('view'))
  const { queueMatches, awaitingPaymentMatches, settlingMatches } = useMatchingLiveSync()
  const pathnameRef = useRef(pathname)
  const onFeedbackRef = useRef(onFeedback)

  useEffect(() => {
    pathnameRef.current = pathname
  }, [pathname])

  useEffect(() => {
    onFeedbackRef.current = onFeedback
  }, [onFeedback])

  useEffect(() => {
    return subscribeMatchingCrossTabMessages({
      eventId,
      pollOnMount: true,
      onMessage: (message) => {
        const currentPath = pathnameRef.current
        const isMatchingBoard =
          currentPath.includes('/matching') && !currentPath.endsWith('/matching/pit')

        if (message.eventId !== eventId || !isMatchingBoard) return
        if (message.action !== 'palitada_added' && message.action !== 'palitada_removed') return

        const fightLabel =
          message.fightNumber != null ? `Fight #${message.fightNumber}` : 'the open fight'
        const bannerMessage =
          message.action === 'palitada_added'
            ? `Palitada recorded on ${fightLabel} from Bet Balancing pit.`
            : `Palitada removed on ${fightLabel} from Bet Balancing pit.`

        onFeedbackRef.current?.(bannerMessage, false)

        window.setTimeout(() => {
          if (message.action === 'palitada_added') {
            showPalitadaRecordedToast(fightLabel)
            return
          }

          showPalitadaRemovedToast(fightLabel)
        }, 0)
      },
    })
  }, [eventId])

  const visibleViews = useMemo(() => {
    const views: MatchingView[] = ['active', 'queue', 'pending']
    if (canSettle || settlingMatches.length > 0) views.push('settling')
    if (canManage) views.push('desk')
    return views
  }, [canManage, canSettle, settlingMatches.length])

  const activeMatch = useMemo(() => resolveActiveMatch(queueMatches), [queueMatches])
  const palitadaTargetMatch = useMemo(
    () => resolveBetBalancingTargetMatch(queueMatches),
    [queueMatches]
  )
  const betBalancingMatch = useMemo(() => {
    const targetId = palitadaTargetMatch?.id ?? activeMatch?.id
    if (!targetId) return null
    return (
      queueMatches.find((match) => match.id === targetId) ??
      palitadaTargetMatch ??
      activeMatch
    )
  }, [activeMatch, palitadaTargetMatch, queueMatches])
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
              {view === 'settling' && settlingMatches.length > 0 ? (
                <Badge ml={2} size="sm" colorPalette="purple">
                  {settlingMatches.length}
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
          betBalancingMatch={betBalancingMatch}
          palitadaTargetMatch={palitadaTargetMatch}
          taxPerFight={taxPerFight}
          taxCommissionRate={taxCommissionRate}
          canManage={canManage}
          canManagePalitada={canManagePalitada}
          canManageQueueOverride={canManageQueueOverride}
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
          canManageQueueOverride={canManageQueueOverride}
        />
      </Tabs.Content>

      <Tabs.Content value="pending" pt={4}>
        <MatchingPendingPaymentsPanel
          eventId={eventId}
          awaitingPaymentMatches={awaitingPaymentMatches}
          canManage={canManage}
        />
      </Tabs.Content>

      <Tabs.Content value="settling" pt={4}>
        <MatchingSettlingPanel
          eventId={eventId}
          settlingMatches={settlingMatches}
          canSettle={canSettle}
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
