'use client'

import { Box, Text } from '@chakra-ui/react'

import {
  formatCurrencyDetailed,
  SidePaymentBadges,
} from '@/features/matches/components/matching-shared'
import { FIGHT_SIDE_LABELS } from '@/features/matches/schema'
import type { MatchSideDetails } from '@/features/matches/types'

type MatchingMatchSideBlockProps = {
  side: 'meron' | 'wala'
  details: MatchSideDetails
  emphasizeBet?: boolean
}

export function MatchingMatchSideBlock({
  side,
  details,
  emphasizeBet = false,
}: MatchingMatchSideBlockProps) {
  return (
    <Box>
      <Text fontSize="xs" color="fg.muted" textTransform="uppercase">
        {FIGHT_SIDE_LABELS[side]}
      </Text>
      <Text fontWeight="medium">{details.entry_name}</Text>
      <Text fontSize="sm" color="fg.muted">
        Cock #{details.cock_number} · Band {details.band_number}
      </Text>
      <Text
        fontSize={emphasizeBet ? 'lg' : 'sm'}
        fontWeight={emphasizeBet ? 'semibold' : 'normal'}
        color={emphasizeBet ? undefined : 'fg.muted'}
        mt={emphasizeBet ? 1 : 0}
      >
        Bet {formatCurrencyDetailed(details.bet_amount)}
      </Text>
      <SidePaymentBadges side={details} />
    </Box>
  )
}
