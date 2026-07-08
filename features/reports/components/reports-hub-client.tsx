'use client'

import { Badge, Box, Button, Flex, Text } from '@chakra-ui/react'
import Link from 'next/link'
import { useState, useTransition } from 'react'

import { downloadReportCsvAction } from '@/features/reports/actions'
import type { EventReportType } from '@/features/reports/types'
import type { EventListItem } from '@/features/events/types'

type EventReportDefinition = {
  type: EventReportType
  label: string
  description: string
  viewHref?: string
}

const EVENT_REPORTS: EventReportDefinition[] = [
  {
    type: 'event_summary',
    label: 'Event summary',
    description: 'Entries, matches, weigh-ins, and payment totals for the event.',
  },
  {
    type: 'registration',
    label: 'Registration',
    description: 'All entries with registration and payment status.',
  },
  {
    type: 'weighing',
    label: 'Weighing',
    description: 'Official weights and verification status per rooster.',
    viewHref: 'weighing',
  },
  {
    type: 'match',
    label: 'Matches',
    description: 'Fight pairings with meron and wala details.',
  },
  {
    type: 'result',
    label: 'Results',
    description: 'Fight outcomes and verification status.',
  },
  {
    type: 'financial',
    label: 'Financial',
    description: 'Payment ledger with amounts due, paid, and balance.',
  },
  {
    type: 'audit',
    label: 'Audit trail',
    description: 'Event-scoped audit log entries.',
  },
]

type ReportsHubClientProps = {
  eventId: string
  eventName: string
}

function triggerCsvDownload(csv: string, filename: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

export function ReportsHubClient({ eventId, eventName }: ReportsHubClientProps) {
  const [pendingType, setPendingType] = useState<EventReportType | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleDownload(reportType: EventReportType) {
    setError(null)
    setPendingType(reportType)

    startTransition(async () => {
      const result = await downloadReportCsvAction(reportType, eventId)
      setPendingType(null)

      if (result.error || !result.csv || !result.filename) {
        setError(result.error ?? 'Failed to download report')
        return
      }

      triggerCsvDownload(result.csv, result.filename)
    })
  }

  return (
    <Box className="space-y-6">
      <Box>
        <Text fontSize="2xl" fontWeight="semibold">
          Reports
        </Text>
        <Text color="fg.muted">
          Generate and download CSV reports for {eventName}.
        </Text>
      </Box>

      {error ? (
        <Box
          px={4}
          py={3}
          rounded="md"
          borderWidth="1px"
          borderColor="border.error"
          bg="bg.error"
        >
          <Text fontSize="sm" color="fg.error">
            {error}
          </Text>
        </Box>
      ) : null}

      <Box borderWidth="1px" borderColor="border" rounded="lg" overflow="hidden">
        {EVENT_REPORTS.map((report, index) => {
          const isDownloading = isPending && pendingType === report.type
          const viewHref = report.viewHref
            ? `/dashboard/events/${eventId}/reports/${report.viewHref}`
            : null

          return (
            <Flex
              key={report.type}
              px={4}
              py={4}
              gap={4}
              align={{ base: 'stretch', md: 'center' }}
              direction={{ base: 'column', md: 'row' }}
              borderTopWidth={index === 0 ? 0 : '1px'}
              borderColor="border"
              justify="space-between"
            >
              <Box flex="1">
                <Flex align="center" gap={2} mb={1}>
                  <Text fontWeight="medium">{report.label}</Text>
                  <Badge size="sm" variant="subtle">
                    CSV
                  </Badge>
                </Flex>
                <Text fontSize="sm" color="fg.muted">
                  {report.description}
                </Text>
              </Box>

              <Flex gap={2} shrink={0}>
                {viewHref ? (
                  <Button asChild size="sm" variant="outline">
                    <Link href={viewHref}>View</Link>
                  </Button>
                ) : null}
                <Button
                  size="sm"
                  loading={isDownloading}
                  onClick={() => handleDownload(report.type)}
                >
                  Download CSV
                </Button>
              </Flex>
            </Flex>
          )
        })}
      </Box>
    </Box>
  )
}

type GlobalReportsClientProps = {
  events: EventListItem[]
}

export function GlobalReportsClient({ events }: GlobalReportsClientProps) {
  const [error, setError] = useState<string | null>(null)
  const [pendingReport, setPendingReport] = useState<'audit' | 'promoter' | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleGlobalDownload(reportType: 'audit' | 'promoter') {
    setError(null)
    setPendingReport(reportType)

    startTransition(async () => {
      const result = await downloadReportCsvAction(reportType)
      setPendingReport(null)

      if (result.error || !result.csv || !result.filename) {
        setError(result.error ?? 'Failed to download report')
        return
      }

      triggerCsvDownload(result.csv, result.filename)
    })
  }

  return (
    <Box className="space-y-8">
      <Box>
        <Text fontSize="2xl" fontWeight="semibold">
          Reports
        </Text>
        <Text color="fg.muted">
          Global reports and event-scoped exports.
        </Text>
      </Box>

      {error ? (
        <Box
          px={4}
          py={3}
          rounded="md"
          borderWidth="1px"
          borderColor="border.error"
          bg="bg.error"
        >
          <Text fontSize="sm" color="fg.error">
            {error}
          </Text>
        </Box>
      ) : null}

      <Box className="space-y-3">
        <Text fontWeight="semibold">Global reports</Text>
        <Box borderWidth="1px" borderColor="border" rounded="lg" overflow="hidden">
          <Flex
            px={4}
            py={4}
            gap={4}
            align={{ base: 'stretch', md: 'center' }}
            direction={{ base: 'column', md: 'row' }}
            justify="space-between"
            borderBottomWidth="1px"
            borderColor="border"
          >
            <Box>
              <Text fontWeight="medium">Promoter report</Text>
              <Text fontSize="sm" color="fg.muted">
                Events hosted, referrals, and collections by promoter.
              </Text>
            </Box>
            <Flex gap={2}>
              <Button asChild size="sm" variant="outline">
                <Link href="/dashboard/reports/promoters">View</Link>
              </Button>
              <Button
                size="sm"
                loading={isPending && pendingReport === 'promoter'}
                onClick={() => handleGlobalDownload('promoter')}
              >
                Download CSV
              </Button>
            </Flex>
          </Flex>
          <Flex
            px={4}
            py={4}
            gap={4}
            align={{ base: 'stretch', md: 'center' }}
            direction={{ base: 'column', md: 'row' }}
            justify="space-between"
          >
            <Box>
              <Text fontWeight="medium">Audit trail</Text>
              <Text fontSize="sm" color="fg.muted">
                System-wide audit log export (latest 500 entries).
              </Text>
            </Box>
            <Flex gap={2}>
              <Button asChild size="sm" variant="outline">
                <Link href="/dashboard/audit">View</Link>
              </Button>
              <Button
                size="sm"
                loading={isPending && pendingReport === 'audit'}
                onClick={() => handleGlobalDownload('audit')}
              >
                Download CSV
              </Button>
            </Flex>
          </Flex>
        </Box>
      </Box>

      <Box className="space-y-3">
        <Text fontWeight="semibold">Event reports</Text>
        <Box borderWidth="1px" borderColor="border" rounded="lg" overflow="hidden">
          {events.length === 0 ? (
            <Box px={4} py={6} color="fg.muted">
              No events yet.
            </Box>
          ) : (
            events.map((event, index) => (
              <Flex
                key={event.id}
                px={4}
                py={4}
                gap={4}
                align={{ base: 'stretch', sm: 'center' }}
                direction={{ base: 'column', sm: 'row' }}
                justify="space-between"
                borderTopWidth={index === 0 ? 0 : '1px'}
                borderColor="border"
              >
                <Box>
                  <Text fontWeight="medium">{event.name}</Text>
                  <Text fontSize="sm" color="fg.muted">
                    {event.venue} · {new Date(event.event_date).toLocaleDateString()}
                  </Text>
                </Box>
                <Button asChild size="sm">
                  <Link href={`/dashboard/events/${event.id}/reports`}>Open reports</Link>
                </Button>
              </Flex>
            ))
          )}
        </Box>
      </Box>
    </Box>
  )
}
