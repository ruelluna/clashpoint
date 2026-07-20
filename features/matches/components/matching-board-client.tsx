'use client'

import { Box, Text } from '@chakra-ui/react'
import { Suspense, useState } from 'react'

import { PageHeader, PageStack } from '@/components/dashboard'
import { MatchingLiveSyncProvider } from '@/features/matches/components/matching-live-sync-provider'
import { MatchingSubTabs } from '@/features/matches/components/matching-sub-tabs'
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

function MatchingBoardContent(props: MatchingBoardClientProps) {
  const [feedback, setFeedback] = useState<{ message: string; isError: boolean } | null>(
    null
  )

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
        <MatchingSubTabs
          {...props}
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
      </Suspense>
    </PageStack>
  )
}

export function MatchingBoardClient(props: MatchingBoardClientProps) {
  return (
    <MatchingLiveSyncProvider
      eventId={props.eventId}
      initialQueueMatches={props.queueMatches}
      initialAwaitingPaymentMatches={props.awaitingPaymentMatches}
      initialSettlingMatches={props.settlingMatches}
    >
      <MatchingBoardContent {...props} />
    </MatchingLiveSyncProvider>
  )
}
