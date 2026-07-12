'use client'

import { Box, Flex, Stack, Text } from '@chakra-ui/react'

import type { PublicWinnersSummary } from '@/features/public/types'

function formatCurrency(amount: number) {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'PHP',
  }).format(amount)
}

export function PublicWinnersList({
  winners,
  showAmounts,
}: {
  winners: PublicWinnersSummary
  showAmounts: boolean
}) {
  return (
    <Stack gap={6}>
      {winners.champions.length > 0 ? (
        <Box borderWidth="1px" borderColor="border" rounded="lg" p={4}>
          <Text fontWeight="medium" mb={3}>
            Champions
          </Text>
          <Flex direction="column" gap={2}>
            {winners.champions.map((champion) => (
              <Box key={champion.entry_id}>
                <Text fontWeight="medium">{champion.entry_name}</Text>
                <Text fontSize="sm" color="fg.muted">
                  #{champion.entry_number}
                </Text>
              </Box>
            ))}
          </Flex>
          {winners.finalized_at ? (
            <Text fontSize="sm" color="fg.muted" mt={3}>
              Finalized {new Date(winners.finalized_at).toLocaleString()}
            </Text>
          ) : null}
        </Box>
      ) : null}

      <Box borderWidth="1px" borderColor="border" rounded="lg" overflow="hidden">
        <Box p={4} borderBottomWidth="1px" borderColor="border">
          <Text fontWeight="medium">Prize winners</Text>
          {!showAmounts ? (
            <Text fontSize="sm" color="fg.muted">
              Prize amounts are not published for this event.
            </Text>
          ) : null}
        </Box>
        {winners.payouts.length === 0 ? (
          <Box p={4}>
            <Text fontSize="sm" color="fg.muted">
              No prize payouts published yet.
            </Text>
          </Box>
        ) : (
          <Box overflowX="auto">
            <Box as="table" width="full" fontSize="sm">
              <Box as="thead" bg="bg.subtle">
                <Box as="tr">
                  {['Place', 'Entry', showAmounts ? 'Amount' : null]
                    .filter(Boolean)
                    .map((heading) => (
                      <Box
                        as="th"
                        key={heading as string}
                        textAlign="left"
                        px={4}
                        py={3}
                        fontWeight="medium"
                      >
                        {heading}
                      </Box>
                    ))}
                </Box>
              </Box>
              <Box as="tbody">
                {winners.payouts.map((payout) => (
                  <Box as="tr" key={payout.id} borderTopWidth="1px" borderColor="border">
                    <Box as="td" px={4} py={3} fontWeight="medium">
                      {payout.rank_label}
                    </Box>
                    <Box as="td" px={4} py={3}>
                      <Text fontWeight="medium">{payout.entry_name}</Text>
                      <Text fontSize="xs" color="fg.muted">
                        #{payout.entry_number}
                      </Text>
                    </Box>
                    {showAmounts ? (
                      <Box as="td" px={4} py={3}>
                        {payout.amount != null ? formatCurrency(payout.amount) : '—'}
                      </Box>
                    ) : null}
                  </Box>
                ))}
              </Box>
            </Box>
          </Box>
        )}
      </Box>
    </Stack>
  )
}
