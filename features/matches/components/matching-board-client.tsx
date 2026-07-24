'use client'

import { Box, Text } from '@chakra-ui/react'
import { Suspense, useCallback, useState } from 'react'

import { PageHeader, PageStack } from '@/components/dashboard'
import { MatchingLiveSyncProvider } from '@/features/matches/components/matching-live-sync-provider'
import { MatchingSubTabs } from '@/features/matches/components/matching-sub-tabs'
import type { MatchingSyncMessage } from '@/features/matches/matching-cross-tab-sync'
import type { EligibleRooster, MatchListItem, SettlingMatchListItem } from '@/features/matches/types'

type MatchingBoardClientProps = {
  eventId: string
  eventName: string
  awaitingPaymentMatches: MatchListItem[]
  queueMatches: MatchListItem[]
  settlingMatches: SettlingMatchListItem[]
  eligibleRoosters: EligibleRooster[]
  verifiedResultMatchIds: string[]
  taxPerFight: number
  taxCommissionRate: number
  canManage: boolean
  canManagePalitada: boolean
  canManageQueueOverride: boolean
  canSettle: boolean
  canRecordResult: boolean
}

type MatchingBoardContentProps = MatchingBoardClientProps & {
  feedback: { message: string; isError: boolean } | null
  onFeedback: (message: string | null, isError: boolean) => void
}

function MatchingBoardContent({
  feedback,
  onFeedback,
  ...props
}: MatchingBoardContentProps) {
  return (
    <PageStack>
      <PageHeader
        title="Matching"
        description={`Pair roosters and record pledge amounts for ${props.eventName}. Handlers pay at Cashier Terminal — matching staff do not collect payments.`}
      />

      {feedback ? (
        <Box
          rounded="md"
          px={3}
          py={2}
          fontSize="sm"
          bg={feedback.isError ? 'red.subtle' : 'green.subtle'}
          color={feedback.isError ? 'red.fg' : 'green.fg'}
        >
          {feedback.message}
        </Box>
      ) : null}

      <Suspense
        fallback={
          <Text fontSize="sm" color="fg.muted">
            Loading matching tabs…
          </Text>
        }
      >
        <MatchingSubTabs {...props} onFeedback={onFeedback} />
      </Suspense>
    </PageStack>
  )
}

export function MatchingBoardClient(props: MatchingBoardClientProps) {
  const [feedback, setFeedback] = useState<{ message: string; isError: boolean } | null>(
    null
  )

  const handlePalitadaPitSync = useCallback((message: MatchingSyncMessage) => {
    if (message.action !== 'palitada_added' && message.action !== 'palitada_removed') {
      return
    }

    const fightLabel =
      message.fightNumber != null ? `Fight #${message.fightNumber}` : 'the open fight'
    const bannerMessage =
      message.action === 'palitada_added'
        ? `Palitada recorded on ${fightLabel} from Bet Balancing pit.`
        : `Palitada removed on ${fightLabel} from Bet Balancing pit.`

    window.setTimeout(() => {
      setFeedback({ message: bannerMessage, isError: false })
    }, 0)
  }, [])

  return (
    <MatchingLiveSyncProvider
      eventId={props.eventId}
      initialQueueMatches={props.queueMatches}
      initialAwaitingPaymentMatches={props.awaitingPaymentMatches}
      initialSettlingMatches={props.settlingMatches}
      onPalitadaPitSync={handlePalitadaPitSync}
    >
      <MatchingBoardContent
        {...props}
        feedback={feedback}
        onFeedback={(message, isError) => {
          window.setTimeout(() => {
            if (!message) {
              setFeedback(null)
              return
            }
            setFeedback({ message, isError })
          }, 0)
        }}
      />
    </MatchingLiveSyncProvider>
  )
}
