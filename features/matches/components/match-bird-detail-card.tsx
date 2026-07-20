'use client'

import { Badge, Box, Stack, Text } from '@chakra-ui/react'

import type { MatchListItem } from '@/features/matches/types'
import {
  formatCurrencyDetailed,
  formatWeight,
  SidePaymentBadges,
} from '@/features/matches/components/matching-shared'

type MatchBirdDetailCardProps = {
  side: 'meron' | 'wala'
  details: MatchListItem['meron']
}

const SIDE_LABELS = {
  meron: 'Meron',
  wala: 'Wala',
} as const

const SIDE_COLORS = {
  meron: 'blue',
  wala: 'red',
} as const

export function MatchBirdDetailCard({ side, details }: MatchBirdDetailCardProps) {
  return (
    <Box
      p={4}
      rounded="md"
      borderWidth="2px"
      borderColor={`${SIDE_COLORS[side]}.muted`}
      bg={`${SIDE_COLORS[side]}.subtle`}
      flex="1"
    >
      <Stack gap={2}>
        <Badge colorPalette={SIDE_COLORS[side]} size="sm" alignSelf="flex-start">
          {SIDE_LABELS[side]}
        </Badge>
        <Text fontSize="lg" fontWeight="semibold">
          {details.entry_name}
        </Text>
        <Text fontSize="sm" color="fg.muted">
          Owner: {details.owner_name}
        </Text>
        <Text fontSize="sm" color="fg.muted">
          Cock #{details.cock_number} · Band {details.band_number}
        </Text>
        <Text fontSize="sm" color="fg.muted">
          Weight: {formatWeight(details.weight)}
        </Text>
        <Text fontSize="sm" fontWeight="medium">
          Pledge {formatCurrencyDetailed(details.bet_amount)}
        </Text>
        <SidePaymentBadges side={details} />
      </Stack>
    </Box>
  )
}
