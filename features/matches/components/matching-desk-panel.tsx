'use client'

import {
  Badge,
  Box,
  Button,
  Flex,
  Input,
  NativeSelect,
  Stack,
  Text,
} from '@chakra-ui/react'
import { useRouter } from 'next/navigation'
import { useActionState, useEffect, useMemo, useState } from 'react'

import { FormField, LAYOUT_GAP, PanelCard } from '@/components/dashboard'
import { evaluateMatchCompatibilityAction } from '@/features/eligibility/actions'
import type { MatchCompatibilityEvaluation } from '@/features/compatibility/types'
import { createMatchAction } from '@/features/matches/actions'
import { MatchingRoosterScanRow } from '@/features/matches/components/matching-rooster-scan-row'
import {
  formatWeight,
  initialMatchActionState,
  roosterLabel,
} from '@/features/matches/components/matching-shared'
import type { EligibleRooster } from '@/features/matches/types'
import { COMPATIBILITY_STATUS_LABELS } from '@/lib/derby/enums'
import type { CompatibilityStatus } from '@/lib/derby/enums'

type MatchingDeskPanelProps = {
  eventId: string
  eligibleRoosters: EligibleRooster[]
  canManage: boolean
  onFeedback?: (message: string | null, isError: boolean) => void
}

function compatibilityColor(
  status: CompatibilityStatus
): 'green' | 'orange' | 'red' | 'gray' {
  switch (status) {
    case 'compatible':
      return 'green'
    case 'approval_required':
      return 'orange'
    case 'prohibited':
      return 'red'
    default:
      return 'gray'
  }
}

function RoosterCard({
  label,
  rooster,
  onClear,
}: {
  label: string
  rooster: EligibleRooster | undefined
  onClear: () => void
}) {
  if (!rooster) {
    return (
      <Text fontSize="sm" color="fg.muted">
        No {label.toLowerCase()} selected
      </Text>
    )
  }

  return (
    <Box p={3} rounded="md" borderWidth="1px" borderColor="border" bg="bg.subtle">
      <Flex justify="space-between" align="start" gap={2}>
        <Stack gap={1}>
          <Text fontSize="xs" color="fg.muted" textTransform="uppercase">
            {label}
          </Text>
          <Text fontWeight="medium">{rooster.entry_name}</Text>
          <Text fontSize="sm" color="fg.muted">
            {roosterLabel(rooster)} · {formatWeight(rooster.official_weight)}
          </Text>
        </Stack>
        <Button size="xs" variant="ghost" onClick={onClear}>
          Clear
        </Button>
      </Flex>
    </Box>
  )
}

export function MatchingDeskPanel({
  eventId,
  eligibleRoosters,
  canManage,
  onFeedback,
}: MatchingDeskPanelProps) {
  const router = useRouter()
  const [createState, createAction, createPending] = useActionState(
    createMatchAction,
    initialMatchActionState
  )

  const [meronRooster, setMeronRooster] = useState<EligibleRooster | null>(null)
  const [walaRooster, setWalaRooster] = useState<EligibleRooster | null>(null)
  const [compatibility, setCompatibility] = useState<MatchCompatibilityEvaluation | null>(
    null
  )
  const [compatibilityLoading, setCompatibilityLoading] = useState(false)
  const [compatibilityError, setCompatibilityError] = useState<string | null>(null)

  const roosterMap = useMemo(
    () => new Map(eligibleRoosters.map((rooster) => [rooster.rooster_id, rooster])),
    [eligibleRoosters]
  )

  useEffect(() => {
    if (createState.matchId) {
      router.push(`/dashboard/events/${eventId}/matching/${createState.matchId}/print`)
    }
  }, [createState.matchId, eventId, router])

  useEffect(() => {
    if (createState.error) {
      onFeedback?.(createState.error, true)
      return
    }
    if (createState.success && !createState.matchId) {
      onFeedback?.(createState.success, false)
    }
  }, [createState.error, createState.success, createState.matchId, onFeedback])

  useEffect(() => {
    const meronId = meronRooster?.rooster_id
    const walaId = walaRooster?.rooster_id
    if (!meronId || !walaId) {
      setCompatibility(null)
      setCompatibilityError(null)
      return
    }

    let cancelled = false
    setCompatibilityLoading(true)
    setCompatibilityError(null)

    evaluateMatchCompatibilityAction(eventId, meronId, walaId)
      .then((result) => {
        if (cancelled) return
        if (result.error) {
          setCompatibility(null)
          setCompatibilityError(result.error)
          return
        }
        setCompatibility(result.evaluation ?? null)
      })
      .finally(() => {
        if (!cancelled) setCompatibilityLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [eventId, meronRooster?.rooster_id, walaRooster?.rooster_id])

  function selectFromDropdown(roosterId: string, side: 'meron' | 'wala') {
    const rooster = roosterMap.get(roosterId)
    if (!rooster) return
    if (side === 'meron') setMeronRooster(rooster)
    else setWalaRooster(rooster)
  }

  if (!canManage) {
    return (
      <PanelCard title="Matching desk">
        <Text fontSize="sm" color="fg.muted">
          You do not have permission to create matches.
        </Text>
      </PanelCard>
    )
  }

  return (
    <PanelCard title="Matching desk">
      <form action={createAction}>
        <input type="hidden" name="eventId" value={eventId} />
        <input type="hidden" name="meronEntryId" value={meronRooster?.entry_id ?? ''} />
        <input type="hidden" name="walaEntryId" value={walaRooster?.entry_id ?? ''} />
        <input type="hidden" name="meronRoosterId" value={meronRooster?.rooster_id ?? ''} />
        <input type="hidden" name="walaRoosterId" value={walaRooster?.rooster_id ?? ''} />

        <Flex direction={{ base: 'column', lg: 'row' }} gap={LAYOUT_GAP.form}>
          <Stack flex="1" gap={LAYOUT_GAP.form}>
            <MatchingRoosterScanRow
              eventId={eventId}
              label="Meron"
              onResolved={setMeronRooster}
            />
            <FormField label="Or select meron">
              <NativeSelect.Root size="sm">
                <NativeSelect.Field
                  value={meronRooster?.rooster_id ?? ''}
                  onChange={(event) =>
                    selectFromDropdown(event.currentTarget.value, 'meron')
                  }
                >
                  <option value="">Select rooster</option>
                  {eligibleRoosters.map((rooster) => (
                    <option key={rooster.rooster_id} value={rooster.rooster_id}>
                      {roosterLabel(rooster)} · {formatWeight(rooster.official_weight)}
                    </option>
                  ))}
                </NativeSelect.Field>
              </NativeSelect.Root>
            </FormField>
            <RoosterCard
              label="Meron"
              rooster={meronRooster ?? undefined}
              onClear={() => setMeronRooster(null)}
            />
            <FormField label="Meron pledge (₱)" required>
              <Input
                name="meronBet"
                type="number"
                min={0.01}
                step="0.01"
                placeholder="Amount"
                required
              />
            </FormField>
          </Stack>

          <Stack flex="1" gap={LAYOUT_GAP.form}>
            <MatchingRoosterScanRow
              eventId={eventId}
              label="Wala"
              onResolved={setWalaRooster}
            />
            <FormField label="Or select wala">
              <NativeSelect.Root size="sm">
                <NativeSelect.Field
                  value={walaRooster?.rooster_id ?? ''}
                  onChange={(event) =>
                    selectFromDropdown(event.currentTarget.value, 'wala')
                  }
                >
                  <option value="">Select rooster</option>
                  {eligibleRoosters.map((rooster) => (
                    <option key={rooster.rooster_id} value={rooster.rooster_id}>
                      {roosterLabel(rooster)} · {formatWeight(rooster.official_weight)}
                    </option>
                  ))}
                </NativeSelect.Field>
              </NativeSelect.Root>
            </FormField>
            <RoosterCard
              label="Wala"
              rooster={walaRooster ?? undefined}
              onClear={() => setWalaRooster(null)}
            />
            <FormField label="Wala pledge (₱)" required>
              <Input
                name="walaBet"
                type="number"
                min={0.01}
                step="0.01"
                placeholder="Amount"
                required
              />
            </FormField>
          </Stack>
        </Flex>

        {meronRooster && walaRooster ? (
          <Box
            mt={LAYOUT_GAP.form}
            p={3}
            rounded="md"
            borderWidth="1px"
            borderColor="border"
            bg="bg.subtle"
          >
            {compatibilityLoading ? (
              <Text fontSize="sm" color="fg.muted">
                Checking compatibility…
              </Text>
            ) : compatibilityError ? (
              <Text fontSize="sm" color="red.fg">
                {compatibilityError}
              </Text>
            ) : compatibility ? (
              <Stack gap={2}>
                <Flex align="center" gap={2}>
                  <Text fontSize="sm" fontWeight="medium">
                    Match compatibility
                  </Text>
                  <Badge colorPalette={compatibilityColor(compatibility.status)} size="sm">
                    {COMPATIBILITY_STATUS_LABELS[compatibility.status]}
                  </Badge>
                </Flex>
                {compatibility.reasons.length > 0 ? (
                  <Stack gap={1}>
                    {compatibility.reasons.map((reason) => (
                      <Text key={reason} fontSize="sm" color="fg.muted">
                        · {reason}
                      </Text>
                    ))}
                  </Stack>
                ) : (
                  <Text fontSize="sm" color="fg.muted">
                    No compatibility issues detected.
                  </Text>
                )}
              </Stack>
            ) : null}
          </Box>
        ) : null}

        <Button
          type="submit"
          size="md"
          loading={createPending}
          disabled={!meronRooster || !walaRooster}
          mt={LAYOUT_GAP.form}
        >
          Create match & print slips
        </Button>
      </form>

      {eligibleRoosters.length === 0 ? (
        <Text mt={3} fontSize="sm" color="fg.muted">
          No eligible roosters. Complete weighing and inspection first.
        </Text>
      ) : null}
    </PanelCard>
  )
}
