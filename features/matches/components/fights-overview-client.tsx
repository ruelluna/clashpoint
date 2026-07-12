'use client'

import { Badge, Box, Button, Flex, Stack, Text } from '@chakra-ui/react'
import Link from 'next/link'

import { LAYOUT_GAP, PageHeader, PageStack, PanelCard } from '@/components/dashboard'
import type { FightQueueSummary } from '@/features/matches/types'

type FightsOverviewClientProps = {
  summaries: FightQueueSummary[]
}

export function FightsOverviewClient({ summaries }: FightsOverviewClientProps) {
  return (
    <PageStack>
      <PageHeader
        title="Fights"
        description="Live fight queues for ongoing events."
      />

      {summaries.length === 0 ? (
        <PanelCard>
          <Text color="fg.muted" textAlign="center">
            No ongoing events with a fight queue.
          </Text>
        </PanelCard>
      ) : (
        <Stack gap={LAYOUT_GAP.form}>
          {summaries.map((summary) => (
            <PanelCard key={summary.event_id}>
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
            </PanelCard>
          ))}
        </Stack>
      )}
    </PageStack>
  )
}
