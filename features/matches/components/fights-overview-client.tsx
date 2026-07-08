'use client'

import { Badge, Box, Button, Flex, Text } from '@chakra-ui/react'
import Link from 'next/link'

import type { FightQueueSummary } from '@/features/matches/types'

type FightsOverviewClientProps = {
  summaries: FightQueueSummary[]
}

export function FightsOverviewClient({ summaries }: FightsOverviewClientProps) {
  return (
    <Box className="space-y-6">
      <Box>
        <Text fontSize="2xl" fontWeight="semibold">
          Fights
        </Text>
        <Text color="fg.muted">
          Live fight queues for ongoing events.
        </Text>
      </Box>

      {summaries.length === 0 ? (
        <Box borderWidth="1px" borderColor="border" rounded="lg" p={8} textAlign="center">
          <Text color="fg.muted">No ongoing events with a fight queue.</Text>
        </Box>
      ) : (
        <Flex direction="column" gap={4}>
          {summaries.map((summary) => (
            <Box
              key={summary.event_id}
              borderWidth="1px"
              borderColor="border"
              rounded="lg"
              p={4}
            >
              <Flex
                justify="space-between"
                align={{ base: 'stretch', md: 'center' }}
                direction={{ base: 'column', md: 'row' }}
                gap={4}
              >
                <Box>
                  <Text fontWeight="semibold">{summary.event_name}</Text>
                  <Text fontSize="sm" color="fg.muted">
                    {summary.venue}
                  </Text>
                  <Flex gap={2} mt={2} wrap="wrap">
                    <Badge variant="subtle">{summary.total_fights} fights</Badge>
                    {summary.current_fight_number != null ? (
                      <Badge colorPalette="green">
                        Live: #{summary.current_fight_number}
                      </Badge>
                    ) : null}
                  </Flex>
                </Box>

                <Flex gap={4} fontSize="sm" wrap="wrap">
                  <Box>
                    <Text color="fg.muted">Scheduled</Text>
                    <Text fontWeight="medium">{summary.scheduled_count}</Text>
                  </Box>
                  <Box>
                    <Text color="fg.muted">Called</Text>
                    <Text fontWeight="medium">{summary.called_count}</Text>
                  </Box>
                  <Box>
                    <Text color="fg.muted">Ready</Text>
                    <Text fontWeight="medium">{summary.ready_count}</Text>
                  </Box>
                  <Box>
                    <Text color="fg.muted">Ongoing</Text>
                    <Text fontWeight="medium">{summary.ongoing_count}</Text>
                  </Box>
                </Flex>

                <Button asChild size="sm" alignSelf={{ base: 'flex-start', md: 'auto' }}>
                  <Link href={`/dashboard/events/${summary.event_id}/fight-queue`}>
                    Open queue
                  </Link>
                </Button>
              </Flex>
            </Box>
          ))}
        </Flex>
      )}
    </Box>
  )
}
