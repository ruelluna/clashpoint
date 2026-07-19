'use client'

import {
  Badge,
  Box,
  Button,
  Flex,
  Input,
  Stack,
  Text,
  Textarea,
} from '@chakra-ui/react'
import { useActionState } from 'react'

import {
  ButtonGroup,
  FormField,
  LAYOUT_GAP,
  PageHeader,
  PageStack,
  PanelCard,
} from '@/components/dashboard'
import {
  recordRevolvingFundAdjustmentAction,
  type RevolvingFundActionState,
} from '@/features/revolving-fund/actions'
import { revolvingFundEntryTypeColorPalette } from '@/features/revolving-fund/display-utils'
import type { RevolvingFundLedgerEntry } from '@/features/revolving-fund/types'

type RevolvingFundClientProps = {
  eventId: string
  eventName: string
  initialBalance: number
  revolvingFundInitial: number
  entries: RevolvingFundLedgerEntry[]
  canManage: boolean
}

const initialState: RevolvingFundActionState = {}

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
  eventId,
  eventName,
  initialBalance,
  revolvingFundInitial,
  entries,
  canManage,
}: RevolvingFundClientProps) {
  const [formState, formAction, pending] = useActionState(
    recordRevolvingFundAdjustmentAction,
    initialState
  )

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

      {canManage ? (
        <PanelCard title="Record adjustment">
          <form action={formAction}>
            <Stack gap={LAYOUT_GAP.form}>
              <input type="hidden" name="eventId" value={eventId} />
              <FormField
                label="Amount"
                helpText="Use a positive value to add funds or negative to deduct."
                required
              >
                <Input
                  name="amount"
                  type="number"
                  step="0.01"
                  required
                  placeholder="e.g. 500 or -200"
                />
              </FormField>
              <FormField label="Description" required>
                <Textarea name="description" rows={2} required />
              </FormField>
              <ButtonGroup>
                <Button type="submit" loading={pending}>
                  Record adjustment
                </Button>
              </ButtonGroup>
              {formState.error ? (
                <Text color="fg.error" fontSize="sm">
                  {formState.error}
                </Text>
              ) : null}
              {formState.success ? (
                <Text color="fg.success" fontSize="sm">
                  {formState.success}
                </Text>
              ) : null}
            </Stack>
          </form>
        </PanelCard>
      ) : null}

      <PanelCard title="Ledger">
        {entries.length === 0 ? (
          <Text color="fg.muted" fontSize="sm">
            No ledger entries yet.
          </Text>
        ) : (
          <Stack gap={3}>
            {entries.map((entry) => (
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
                    <Badge colorPalette={revolvingFundEntryTypeColorPalette(entry.entryType)}>
                      {entryTypeLabel(entry.entryType)}
                    </Badge>
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
            ))}
          </Stack>
        )}
      </PanelCard>
    </PageStack>
  )
}
