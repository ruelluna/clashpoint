'use client'

import { Badge, Box, Button, Flex, Text } from '@chakra-ui/react'
import Link from 'next/link'
import { useState, useTransition } from 'react'

import { downloadReportCsvAction } from '@/features/reports/actions'
import type { PromoterReportRow } from '@/features/reports/types'

type PromoterReportClientProps = {
  rows: PromoterReportRow[]
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'PHP',
  }).format(amount)
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

export function PromoterReportClient({ rows }: PromoterReportClientProps) {
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleDownload() {
    setError(null)

    startTransition(async () => {
      const result = await downloadReportCsvAction('promoter')

      if (result.error || !result.csv || !result.filename) {
        setError(result.error ?? 'Failed to download report')
        return
      }

      triggerCsvDownload(result.csv, result.filename)
    })
  }

  return (
    <Box className="space-y-6">
      <Flex
        justify="space-between"
        align={{ base: 'stretch', sm: 'center' }}
        direction={{ base: 'column', sm: 'row' }}
        gap={3}
      >
        <Box>
          <Text fontSize="2xl" fontWeight="semibold">
            Promoter report
          </Text>
          <Text color="fg.muted">
            Events hosted, entries referred, and collections by promoter.
          </Text>
        </Box>
        <Flex gap={2}>
          <Button asChild size="sm" variant="outline">
            <Link href="/dashboard/reports">← Back to reports</Link>
          </Button>
          <Button size="sm" loading={isPending} onClick={handleDownload}>
            Download CSV
          </Button>
        </Flex>
      </Flex>

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
        {rows.length === 0 ? (
          <Box px={4} py={6} color="fg.muted">
            No promoters found.
          </Box>
        ) : (
          <Box overflowX="auto">
            <Box as="table" width="100%" fontSize="sm">
              <Box as="thead" bg="bg.subtle">
                <Box as="tr">
                  {[
                    'Promoter',
                    'Status',
                    'Contact',
                    'Commission',
                    'Events',
                    'Referred',
                    'Collected',
                  ].map((header) => (
                    <Box as="th" key={header} textAlign="left" px={4} py={3} fontWeight="medium">
                      {header}
                    </Box>
                  ))}
                </Box>
              </Box>
              <Box as="tbody">
                {rows.map((row) => (
                  <Box
                    as="tr"
                    key={row.promoter_id}
                    borderTopWidth="1px"
                    borderColor="border"
                  >
                    <Box as="td" px={4} py={3}>
                      <Text fontWeight="medium">{row.promoter_name}</Text>
                      {row.email ? (
                        <Text color="fg.muted" fontSize="xs">
                          {row.email}
                        </Text>
                      ) : null}
                    </Box>
                    <Box as="td" px={4} py={3}>
                      <Badge>{row.status}</Badge>
                    </Box>
                    <Box as="td" px={4} py={3}>
                      <Text>{row.contact_person ?? '—'}</Text>
                      {row.phone ? (
                        <Text color="fg.muted" fontSize="xs">
                          {row.phone}
                        </Text>
                      ) : null}
                    </Box>
                    <Box as="td" px={4} py={3}>
                      {row.commission_type}
                      {row.commission_value != null ? ` · ${row.commission_value}` : ''}
                    </Box>
                    <Box as="td" px={4} py={3}>
                      {row.events_hosted}
                    </Box>
                    <Box as="td" px={4} py={3}>
                      {row.entries_referred}
                    </Box>
                    <Box as="td" px={4} py={3}>
                      {formatCurrency(row.total_collected)}
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  )
}
