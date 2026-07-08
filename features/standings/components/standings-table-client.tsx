'use client'

import { Badge, Box, Flex, Text } from '@chakra-ui/react'

import type { StandingListItem } from '@/features/standings/types'

export function StandingsTableClient({
  standings,
}: {
  standings: StandingListItem[]
}) {
  return (
    <Box borderWidth="1px" borderColor="border" rounded="lg" overflow="hidden">
      <Box p={4} borderBottomWidth="1px" borderColor="border">
        <Text fontWeight="medium">Event standings</Text>
        <Text fontSize="sm" color="fg.muted">
          Ranked by points, then wins. Win = 1 pt, draw = 0.5 pt, loss = 0 pt.
        </Text>
      </Box>
      {standings.length === 0 ? (
        <Box p={4}>
          <Text fontSize="sm" color="fg.muted">
            No verified results yet. Standings appear after results are verified.
          </Text>
        </Box>
      ) : (
        <Box overflowX="auto">
          <Box as="table" width="full" fontSize="sm">
            <Box as="thead" bg="bg.subtle">
              <Box as="tr">
                {[
                  'Rank',
                  'Entry',
                  'Owner',
                  'W',
                  'L',
                  'D',
                  'Fights',
                  'Points',
                ].map((heading) => (
                  <Box
                    as="th"
                    key={heading}
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
              {standings.map((row) => (
                <Box as="tr" key={row.id} borderTopWidth="1px" borderColor="border">
                  <Box as="td" px={4} py={3}>
                    <Flex align="center" gap={2}>
                      <Text fontWeight="medium">{row.rank ?? '—'}</Text>
                      {row.is_tied ? (
                        <Badge colorPalette="orange" size="sm">
                          Tied
                        </Badge>
                      ) : null}
                    </Flex>
                  </Box>
                  <Box as="td" px={4} py={3}>
                    <Text fontWeight="medium">{row.entry_name}</Text>
                    <Text fontSize="xs" color="fg.muted">
                      #{row.entry_number}
                    </Text>
                  </Box>
                  <Box as="td" px={4} py={3}>
                    {row.owner_name}
                  </Box>
                  <Box as="td" px={4} py={3}>
                    {row.wins}
                  </Box>
                  <Box as="td" px={4} py={3}>
                    {row.losses}
                  </Box>
                  <Box as="td" px={4} py={3}>
                    {row.draws}
                  </Box>
                  <Box as="td" px={4} py={3}>
                    {row.total_fights}
                  </Box>
                  <Box as="td" px={4} py={3} fontWeight="medium">
                    {Number(row.points).toFixed(1)}
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  )
}
