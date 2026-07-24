'use client'

import {
  Badge,
  Box,
  Flex,
  Input,
  Stack,
  Text,
} from '@chakra-ui/react'
import { useMemo, useState } from 'react'

import { PageHeader, PageStack, PanelCard } from '@/components/dashboard'
import type { RevolvingFundLedgerEntry } from '@/features/revolving-fund/types'

type RevolvingFundClientProps = {
  eventName: string
  initialBalance: number
  revolvingFundInitial: number
  entries: RevolvingFundLedgerEntry[]
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'PHP',
  }).format(amount)
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

function entryTypeLabel(entryType: RevolvingFundLedgerEntry['entryType']) {
  switch (entryType) {
    case 'opening':
      return 'Opening'
    case 'collection':
      return 'Collection'
    case 'refund':
      return 'Refund'
    case 'adjustment':
    default:
      return 'Adjustment'
  }
}

export function RevolvingFundClient({
  eventName,
  initialBalance,
  revolvingFundInitial,
  entries,
}: RevolvingFundClientProps) {
  const [ledgerSearch, setLedgerSearch] = useState('')

  const filteredEntries = useMemo(() => {
    const trimmed = ledgerSearch.trim().toLowerCase()
    if (!trimmed) return entries

    return entries.filter((entry) => {
      const haystack = [
        entry.description,
        entryTypeLabel(entry.entryType),
        formatDate(entry.createdAt),
        String(entry.amount),
        formatCurrency(entry.amount),
        String(entry.balanceAfter),
        formatCurrency(entry.balanceAfter),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return haystack.includes(trimmed)
    })
  }, [entries, ledgerSearch])

  return (
    <PageStack>
      <PageHeader
        title="Revolving fund"
        description={`Ledger for ${eventName}`}
      />

      <PanelCard title="Balance">
        <Stack gap={2}>
          <Text fontSize="sm" color="fg.muted">
            Current balance
          </Text>
          <Text fontSize="3xl" fontWeight="semibold">
            {formatCurrency(initialBalance)}
          </Text>
          <Text fontSize="sm" color="fg.muted">
            Initial amount at creation: {formatCurrency(revolvingFundInitial)}
          </Text>
        </Stack>
      </PanelCard>

      <PanelCard title="Ledger">
        {entries.length === 0 ? (
          <Text color="fg.muted" fontSize="sm">
            No ledger entries yet.
          </Text>
        ) : (
          <Stack gap={3}>
            <Flex align="center" gap={3} maxW="md">
              <Text fontSize="sm" fontWeight="medium" whiteSpace="nowrap">
                Search
              </Text>
              <Input
                size="sm"
                placeholder="Filter by type, description, date, or amount"
                value={ledgerSearch}
                onChange={(event) => setLedgerSearch(event.target.value)}
              />
            </Flex>

            {filteredEntries.length === 0 ? (
              <Text color="fg.muted" fontSize="sm">
                No ledger entries match this search.
              </Text>
            ) : (
              filteredEntries.map((entry) => (
                <Flex
                  key={entry.id}
                  direction={{ base: 'column', sm: 'row' }}
                  justify="space-between"
                  gap={2}
                  borderBottomWidth="1px"
                  borderColor="border"
                  pb={3}
                >
                  <Box>
                    <Flex gap={2} align="center" wrap="wrap">
                      <Badge variant="subtle">{entryTypeLabel(entry.entryType)}</Badge>
                      <Text fontSize="sm" color="fg.muted">
                        {formatDate(entry.createdAt)}
                      </Text>
                    </Flex>
                    <Text fontSize="sm" mt={1}>
                      {entry.description ?? '—'}
                    </Text>
                  </Box>
                  <Box textAlign={{ sm: 'right' }}>
                    <Text
                      fontWeight="medium"
                      color={entry.amount >= 0 ? 'fg.success' : 'fg.error'}
                    >
                      {entry.amount >= 0 ? '+' : ''}
                      {formatCurrency(entry.amount)}
                    </Text>
                    <Text fontSize="sm" color="fg.muted">
                      Balance: {formatCurrency(entry.balanceAfter)}
                    </Text>
                  </Box>
                </Flex>
              ))
            )}
          </Stack>
        )}
      </PanelCard>
    </PageStack>
  )
}
