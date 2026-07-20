'use client'

import { useActionState, useEffect, useRef } from 'react'
import { Box, Button, Flex, Input, NativeSelect, Stack, Text } from '@chakra-ui/react'

import { DecimalInput, FormField } from '@/components/dashboard'
import {
  addPalitadaContributionAction,
  deletePalitadaContributionAction,
  type MatchActionState,
} from '@/features/matches/actions'
import { useMatchingLiveSync } from '@/features/matches/components/matching-live-sync-provider'
import { formatCurrency } from '@/features/matches/components/matching-shared'
import { broadcastMatchingRefresh } from '@/features/matches/matching-cross-tab-sync'
import {
  showPalitadaRecordedToast,
  showPalitadaRemovedToast,
} from '@/features/matches/palitada-sync-toast'
import { FIGHT_SIDE_LABELS } from '@/features/matches/schema'
import type { MatchListItem } from '@/features/matches/types'

const initialState: MatchActionState = {}

type MatchPalitadaRecordFormProps = {
  eventId: string
  match: MatchListItem
  underdogSide: 'meron' | 'wala' | null
  disabled?: boolean
}

export function MatchPalitadaRecordForm({
  eventId,
  match,
  underdogSide,
  disabled = false,
}: MatchPalitadaRecordFormProps) {
  const { refreshMatch } = useMatchingLiveSync()
  const [addState, addAction, addPending] = useActionState(
    addPalitadaContributionAction,
    initialState
  )
  const [deleteState, deleteAction, deletePending] = useActionState(
    deletePalitadaContributionAction,
    initialState
  )
  const wasAddPending = useRef(false)
  const wasDeletePending = useRef(false)

  useEffect(() => {
    const addCompleted = wasAddPending.current && !addPending && Boolean(addState.success)
    wasAddPending.current = addPending
    if (!addCompleted) return

    broadcastMatchingRefresh(eventId, match.id, {
      action: 'palitada_added',
      fightNumber: match.fight_number,
    })
    showPalitadaRecordedToast(
      match.fight_number != null ? `Fight #${match.fight_number}` : 'The open fight'
    )
    void refreshMatch(match.id)
  }, [addPending, addState.success, eventId, match.fight_number, match.id, refreshMatch])

  useEffect(() => {
    const deleteCompleted =
      wasDeletePending.current && !deletePending && Boolean(deleteState.success)
    wasDeletePending.current = deletePending
    if (!deleteCompleted) return

    broadcastMatchingRefresh(eventId, match.id, {
      action: 'palitada_removed',
      fightNumber: match.fight_number,
      contributionId: deleteState.contributionId,
    })
    showPalitadaRemovedToast(
      match.fight_number != null ? `Fight #${match.fight_number}` : 'The open fight'
    )
    void refreshMatch(match.id)
  }, [deletePending, deleteState.contributionId, deleteState.success, eventId, match.fight_number, match.id, refreshMatch])

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
        {underdogSide ? (
          <form action={addAction}>
            <fieldset disabled={disabled}>
              <input type="hidden" name="eventId" value={eventId} />
              <input type="hidden" name="matchId" value={match.id} />
              <input type="hidden" name="side" value={underdogSide} />
              <Stack gap={3}>
                <Text fontSize="sm" color="fg.muted">
                  Underdog side: {FIGHT_SIDE_LABELS[underdogSide]} — Palitada is recorded on the
                  lower pledge side only.
                </Text>
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
                <DecimalInput name="amount" min="0.01" step="0.01" size="sm" required />
              </FormField>
              <Button type="submit" size="sm" loading={addPending} alignSelf="flex-start">
                Add Palitada
              </Button>
            </Stack>
          </fieldset>
        </form>
        ) : (
          <Text fontSize="sm" color="fg.muted">
            Sides are balanced — Palitada is not needed on either side.
          </Text>
        )}
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
