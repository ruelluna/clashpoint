'use client'

import { Badge, Box, Flex, Text } from '@chakra-ui/react'

import type { PublicMatch } from '@/features/public/types'

function formatWeight(weight: number | null) {
  if (weight == null) return '—'
  return `${weight.toFixed(2)} kg`
}

export function PublicMatchesList({ matches }: { matches: PublicMatch[] }) {
  return (
    <Box borderWidth="1px" borderColor="border" rounded="lg" overflow="hidden">
      <Box p={4} borderBottomWidth="1px" borderColor="border">
        <Text fontWeight="medium">Match card</Text>
        <Text fontSize="sm" color="fg.muted">
          Published fights for this event.
        </Text>
      </Box>
      {matches.length === 0 ? (
        <Box p={4}>
          <Text fontSize="sm" color="fg.muted">
            No matches published yet.
          </Text>
        </Box>
      ) : (
        <Box overflowX="auto">
          <Box as="table" width="full" fontSize="sm">
            <Box as="thead" bg="bg.subtle">
              <Box as="tr">
                {['Fight', 'Meron', 'Wala', 'Status'].map((heading) => (
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
              {matches.map((match) => (
                <Box as="tr" key={match.id} borderTopWidth="1px" borderColor="border">
                  <Box as="td" px={4} py={3} fontWeight="medium">
                    #{match.fight_number}
                    {match.round_number ? ` · R${match.round_number}` : ''}
                  </Box>
                  <Box as="td" px={4} py={3}>
                    <Text fontWeight="medium">{match.meron.entry_name}</Text>
                    <Text fontSize="xs" color="fg.muted">
                      #{match.meron.entry_number} · Cock {match.meron.cock_number} ·{' '}
                      {formatWeight(match.meron.weight)}
                    </Text>
                  </Box>
                  <Box as="td" px={4} py={3}>
                    <Text fontWeight="medium">{match.wala.entry_name}</Text>
                    <Text fontSize="xs" color="fg.muted">
                      #{match.wala.entry_number} · Cock {match.wala.cock_number} ·{' '}
                      {formatWeight(match.wala.weight)}
                    </Text>
                  </Box>
                  <Box as="td" px={4} py={3}>
                    <Flex gap={2} align="center">
                      <Badge variant="subtle">{match.status}</Badge>
                      {match.queue_status ? (
                        <Badge colorPalette="blue" size="sm">
                          {match.queue_status}
                        </Badge>
                      ) : null}
                    </Flex>
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
