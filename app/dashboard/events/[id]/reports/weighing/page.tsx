import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Badge, Box, Button, Flex, Text } from '@chakra-ui/react'

import { EventDetailTabs } from '@/features/events/components/event-detail-tabs'
import { getEvent } from '@/features/events/queries'
import { WEIGHT_STATUS_LABELS } from '@/features/weighing/schema'
import {
  countWeighingStats,
  listWeighingReport,
} from '@/features/weighing/queries'
import type { WeighingReportRow } from '@/features/weighing/types'
import { requirePermission } from '@/lib/auth/permissions'

type WeighingReportPageProps = {
  params: Promise<{ id: string }>
}

function statusColor(
  status: WeighingReportRow['weight_status']
): 'green' | 'red' | 'orange' | 'gray' {
  if (status === 'passed') return 'green'
  if (status === 'failed') return 'red'
  if (status === 'for_review') return 'orange'
  return 'gray'
}

function formatWeight(value: number | null) {
  if (value == null) return '—'
  return `${value.toFixed(2)} kg`
}

export default async function WeighingReportPage({ params }: WeighingReportPageProps) {
  await requirePermission('reports.view')
  const { id: eventId } = await params

  const event = await getEvent(eventId)
  if (!event) notFound()

  const [rows, stats] = await Promise.all([
    listWeighingReport(eventId),
    countWeighingStats(eventId),
  ])

  return (
    <Box className="space-y-6">
      <EventDetailTabs eventId={event.id} eventName={event.name} />

      <Flex justify="space-between" align="center" wrap="wrap" gap={3}>
        <Box>
          <Text fontSize="2xl" fontWeight="semibold">
            Weighing report
          </Text>
          <Text color="fg.muted">
            {stats.verified} verified · {stats.passed} passed · {stats.failed} failed ·{' '}
            {stats.total} roosters in lineups
          </Text>
        </Box>
        <Button asChild size="sm" variant="outline">
          <Link href={`/dashboard/events/${eventId}/weighing`}>Weighing station</Link>
        </Button>
      </Flex>

      <Box borderWidth="1px" borderColor="border" rounded="lg" overflow="hidden">
        <Box overflowX="auto">
          <Box as="table" width="100%" fontSize="sm">
            <Box as="thead" bg="bg.subtle">
              <Box as="tr">
                {[
                  'Entry',
                  'Cock',
                  'Band',
                  'Declared',
                  'Official',
                  'Status',
                  'Verified',
                  'Notes',
                ].map((header) => (
                  <Box as="th" key={header} textAlign="left" px={4} py={3} fontWeight="medium">
                    {header}
                  </Box>
                ))}
              </Box>
            </Box>
            <Box as="tbody">
              {rows.length === 0 ? (
                <Box as="tr">
                  <td colSpan={8}>
                    <Box px={4} py={6} color="fg.muted">
                      No weighing records yet.
                    </Box>
                  </td>
                </Box>
              ) : (
                rows.map((row) => (
                  <Box
                    as="tr"
                    key={row.id}
                    borderTopWidth="1px"
                    borderColor="border"
                  >
                    <Box as="td" px={4} py={3}>
                      <Text fontWeight="medium">#{row.entry_number}</Text>
                      <Text color="fg.muted">{row.entry_name}</Text>
                    </Box>
                    <Box as="td" px={4} py={3}>
                      #{row.cock_number}
                    </Box>
                    <Box as="td" px={4} py={3}>
                      {row.band_number}
                    </Box>
                    <Box as="td" px={4} py={3}>
                      {formatWeight(row.declared_weight)}
                    </Box>
                    <Box as="td" px={4} py={3}>
                      {formatWeight(row.official_weight)}
                    </Box>
                    <Box as="td" px={4} py={3}>
                      <Badge colorPalette={statusColor(row.weight_status)}>
                        {WEIGHT_STATUS_LABELS[row.weight_status]}
                      </Badge>
                    </Box>
                    <Box as="td" px={4} py={3}>
                      {row.verified_at
                        ? new Date(row.verified_at).toLocaleString(undefined, {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          })
                        : '—'}
                    </Box>
                    <Box as="td" px={4} py={3} maxW="xs">
                      {row.notes ?? '—'}
                    </Box>
                  </Box>
                ))
              )}
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  )
}
