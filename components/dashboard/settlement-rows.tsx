'use client'

import { Badge, Box, Flex, Stack, Text } from '@chakra-ui/react'
import type { ReactNode } from 'react'

import { formatCurrency } from '@/features/matches/components/matching-shared'

type SettlementRowProps = {
  primary: string
  secondary?: string | null
  meta?: ReactNode
  amount: number | null
  amountLabel?: string
  statusLabel: string
  statusColor: 'green' | 'orange' | 'blue' | 'gray'
  action?: ReactNode
}

function SettlementRow({
  primary,
  secondary,
  meta,
  amount,
  amountLabel,
  statusLabel,
  statusColor,
  action,
}: SettlementRowProps) {
  const amountDisplay =
    amount != null ? formatCurrency(amount) : amountLabel ?? '—'

  return (
    <Box
      borderTopWidth="1px"
      borderColor="border"
      px={{ base: 3, md: 4 }}
      py={3}
    >
      <Flex
        direction={{ base: 'column', md: 'row' }}
        align={{ base: 'stretch', md: 'center' }}
        gap={{ base: 2, md: 3 }}
      >
        <Box flex="1" minW={0}>
          <Flex gap={2} align="center" wrap="wrap" mb={secondary ? 1 : 0}>
            <Text fontWeight="medium" truncate>
              {primary}
            </Text>
            {meta}
          </Flex>
          {secondary ? (
            <Text fontSize="sm" color="fg.muted" lineClamp={2}>
              {secondary}
            </Text>
          ) : null}
        </Box>

        <Flex
          direction={{ base: 'row', md: 'row' }}
          align={{ base: 'center', md: 'center' }}
          justify={{ base: 'space-between', md: 'flex-end' }}
          gap={3}
          flexWrap="wrap"
          flexShrink={0}
        >
          <Box
            minW={{ md: '6.5rem' }}
            textAlign={{ base: 'left', md: 'right' }}
          >
            <Text fontSize="xs" color="fg.muted" display={{ base: 'inline', md: 'none' }} mr={2}>
              Amount
            </Text>
            <Text fontWeight="semibold" fontSize="sm">
              {amountDisplay}
            </Text>
          </Box>

          <Badge
            size="sm"
            colorPalette={statusColor}
            minW={{ md: '4.5rem' }}
            justifyContent="center"
          >
            {statusLabel}
          </Badge>

          <Box
            minW={{ base: 'full', md: '9rem' }}
            display="flex"
            justifyContent={{ base: 'stretch', md: 'flex-end' }}
          >
            {action ?? (
              <Text fontSize="sm" color="fg.muted" textAlign={{ md: 'right' }} w="full">
                —
              </Text>
            )}
          </Box>
        </Flex>
      </Flex>
    </Box>
  )
}

type SettlementSectionProps = {
  title: string
  progressLabel?: string
  progressColor?: 'green' | 'orange'
  emptyMessage?: ReactNode
  columnHeaders?: boolean
  actionHeader?: string
  children: ReactNode
  feedback?: ReactNode
}

export function SettlementSection({
  title,
  progressLabel,
  progressColor = 'orange',
  emptyMessage,
  columnHeaders = true,
  actionHeader = 'Action',
  children,
  feedback,
}: SettlementSectionProps) {
  const hasRows = Boolean(children)

  return (
    <Stack gap={2}>
      <Flex justify="space-between" align="center" gap={2} wrap="wrap">
        <Text fontSize="sm" fontWeight="medium">
          {title}
        </Text>
        {progressLabel ? (
          <Badge colorPalette={progressColor} size="sm">
            {progressLabel}
          </Badge>
        ) : null}
      </Flex>

      {feedback}

      <Box borderWidth="1px" borderColor="border" rounded="md" overflow="hidden" bg="bg">
        {columnHeaders && hasRows ? (
          <Flex
            display={{ base: 'none', md: 'flex' }}
            px={4}
            py={2}
            bg="bg.subtle"
            fontSize="xs"
            fontWeight="medium"
            color="fg.muted"
            gap={3}
            align="center"
          >
            <Box flex="1">Details</Box>
            <Box minW="6.5rem" textAlign="right">
              Amount
            </Box>
            <Box minW="4.5rem" textAlign="center">
              Status
            </Box>
            <Box minW="9rem" textAlign="right">
              {actionHeader}
            </Box>
          </Flex>
        ) : null}

        {hasRows ? (
          children
        ) : (
          <Box px={4} py={4}>
            {emptyMessage ?? (
              <Text fontSize="sm" color="fg.muted">
                Nothing to settle in this section.
              </Text>
            )}
          </Box>
        )}
      </Box>
    </Stack>
  )
}

export { SettlementRow }
