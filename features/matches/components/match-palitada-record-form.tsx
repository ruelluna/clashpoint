'use client'

import { useActionState } from 'react'
import { Box, Button, Flex, Input, NativeSelect, Stack, Text } from '@chakra-ui/react'

import { FormField } from '@/components/dashboard'
import {
  addPalitadaContributionAction,
  deletePalitadaContributionAction,
  type MatchActionState,
} from '@/features/matches/actions'
import { formatCurrency } from '@/features/matches/components/matching-shared'
import { FIGHT_SIDE_LABELS } from '@/features/matches/schema'
import type { MatchListItem } from '@/features/matches/types'

const initialState: MatchActionState = {}

type MatchPalitadaRecordFormProps = {
  eventId: string
  match: MatchListItem
  defaultSide: 'meron' | 'wala'
  disabled?: boolean
}

export function MatchPalitadaRecordForm({
  eventId,
  match,
  defaultSide,
  disabled = false,
}: MatchPalitadaRecordFormProps) {
  const [addState, addAction, addPending] = useActionState(
    addPalitadaContributionAction,
    initialState
  )
  const [deleteState, deleteAction, deletePending] = useActionState(
    deletePalitadaContributionAction,
    initialState
  )

  const actionMessage =
    addState.error ?? addState.success ?? deleteState.error ?? deleteState.success

  return (
    <Stack gap={4}>
      {actionMessage ? (
        <Text fontSize="sm" color={addState.error || deleteState.error ? 'red.fg' : 'green.fg'}>
          {actionMessage}
        </Text>
      ) : null}

      <Stack gap={2}>
        <Text fontWeight="semibold">Record Palitada</Text>
        <form action={addAction}>
          <fieldset disabled={disabled}>
            <input type="hidden" name="eventId" value={eventId} />
            <input type="hidden" name="matchId" value={match.id} />
            <Stack gap={3}>
              <FormField label="Side" required>
                <NativeSelect.Root size="sm">
                  <NativeSelect.Field name="side" defaultValue={defaultSide}>
                    <option value="meron">Meron</option>
                    <option value="wala">Wala</option>
                  </NativeSelect.Field>
                </NativeSelect.Root>
              </FormField>
              <FormField label="Contributor name" required>
                <Input name="contributorName" size="sm" required />
              </FormField>
              <FormField label="Contributor type" required>
                <NativeSelect.Root size="sm">
                  <NativeSelect.Field name="contributorType" defaultValue="vip">
                    <option value="vip">VIP</option>
                    <option value="monton">Monton revolving fund</option>
                  </NativeSelect.Field>
                </NativeSelect.Root>
              </FormField>
              <FormField label="Amount" required>
                <Input name="amount" type="number" min="0.01" step="0.01" size="sm" required />
              </FormField>
              <Button type="submit" size="sm" loading={addPending} alignSelf="flex-start">
                Add Palitada
              </Button>
            </Stack>
          </fieldset>
        </form>
      </Stack>

      <Stack gap={2}>
        <Text fontWeight="semibold">Recorded contributions</Text>
        {[
          ...match.meron_palitada.map((contributor) => ({
            ...contributor,
            side: 'meron' as const,
          })),
          ...match.wala_palitada.map((contributor) => ({
            ...contributor,
            side: 'wala' as const,
          })),
        ].length === 0 ? (
          <Text fontSize="sm" color="fg.muted">
            No Palitada recorded yet.
          </Text>
        ) : (
          [
            ...match.meron_palitada.map((contributor) => ({
              ...contributor,
              side: 'meron' as const,
            })),
            ...match.wala_palitada.map((contributor) => ({
              ...contributor,
              side: 'wala' as const,
            })),
          ].map((contributor) => (
            <Flex
              key={contributor.id}
              justify="space-between"
              align={{ base: 'stretch', sm: 'center' }}
              direction={{ base: 'column', sm: 'row' }}
              gap={2}
              borderWidth="1px"
              borderColor="border"
              rounded="md"
              p={3}
            >
              <Box>
                <Text fontWeight="medium">{contributor.contributor_name}</Text>
                <Text fontSize="sm" color="fg.muted">
                  {FIGHT_SIDE_LABELS[contributor.side]} ·{' '}
                  {contributor.contributor_type === 'monton' ? 'Monton' : 'VIP'} ·{' '}
                  {formatCurrency(contributor.amount)}
                </Text>
              </Box>
              <form action={deleteAction}>
                <input type="hidden" name="eventId" value={eventId} />
                <input type="hidden" name="matchId" value={match.id} />
                <input type="hidden" name="contributionId" value={contributor.id} />
                <Button
                  type="submit"
                  size="sm"
                  variant="outline"
                  colorPalette="red"
                  loading={deletePending}
                  disabled={disabled}
                >
                  Remove
                </Button>
              </form>
            </Flex>
          ))
        )}
      </Stack>
    </Stack>
  )
}
