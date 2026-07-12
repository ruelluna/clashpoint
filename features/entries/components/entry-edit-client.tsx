'use client'

import {
  Box,
  Button,
  Flex,
  Input,
  NativeSelect,
  Stack,
  Text,
  Textarea,
} from '@chakra-ui/react'
import Link from 'next/link'
import { useActionState } from 'react'

import { ButtonGroup, LAYOUT_GAP, PageHeader, PageStack, PanelCard } from '@/components/dashboard'
import {
  updateEntryAction,
  type EntryActionState,
} from '@/features/entries/actions'
import type { EntryRoosterEditItem } from '@/features/entries/queries'
import { ENTRY_SOURCE_LABELS } from '@/features/entries/schema'
import type { EntryRow } from '@/features/entries/types'
import type { PromoterListItem } from '@/features/promoters/types'

type EntryEditClientProps = {
  eventId: string
  eventName: string
  entry: EntryRow
  roosters: EntryRoosterEditItem[]
  promoters: PromoterListItem[]
  minWeight: number | null
  maxWeight: number | null
}

const initialState: EntryActionState = {}

function formatWeightRange(minWeight: number | null, maxWeight: number | null) {
  if (minWeight == null && maxWeight == null) return 'No weight limits configured'
  return `${minWeight ?? '—'} – ${maxWeight ?? '—'} kg`
}

export function EntryEditClient({
  eventId,
  eventName,
  entry,
  roosters,
  promoters,
  minWeight,
  maxWeight,
}: EntryEditClientProps) {
  const [formState, formAction, pending] = useActionState(updateEntryAction, initialState)

  const activePromoters = promoters.filter((promoter) => promoter.status === 'active')

  return (
    <PageStack maxW="2xl">
      <PageHeader
        title="Edit rooster entry"
        description={`${eventName} · Entry #${entry.entry_number} · Weight limits: ${formatWeightRange(minWeight, maxWeight)}`}
      />

      <form action={formAction}>
        <Stack gap={LAYOUT_GAP.form}>
        <input type="hidden" name="eventId" value={eventId} />
        <input type="hidden" name="entryId" value={entry.id} />
        <input type="hidden" name="roosterIds" value={roosters.map((r) => r.rooster_id).join(',')} />

        <Text fontSize="sm" fontWeight="semibold" color="fg.muted" textTransform="uppercase">
          Owner / handler
        </Text>

        <Box>
          <Text fontSize="sm" fontWeight="medium" mb={1}>
            Entry name
          </Text>
          <Input name="entryName" required maxLength={200} defaultValue={entry.entry_name} />
        </Box>

        <Box>
          <Text fontSize="sm" fontWeight="medium" mb={1}>
            Owner name
          </Text>
          <Input name="ownerName" required maxLength={200} defaultValue={entry.owner_name} />
        </Box>

        <Box>
          <Text fontSize="sm" fontWeight="medium" mb={1}>
            Handler name
          </Text>
          <Input
            name="handlerName"
            maxLength={200}
            defaultValue={entry.handler_name ?? ''}
          />
        </Box>

        <Flex gap={LAYOUT_GAP.form} direction={{ base: 'column', sm: 'row' }}>
          <Box flex="1">
            <Text fontSize="sm" fontWeight="medium" mb={1}>
              Contact number
            </Text>
            <Input
              name="contactNumber"
              maxLength={50}
              defaultValue={entry.contact_number ?? ''}
            />
          </Box>
          <Box flex="1">
            <Text fontSize="sm" fontWeight="medium" mb={1}>
              Email
            </Text>
            <Input
              name="email"
              type="email"
              maxLength={200}
              defaultValue={entry.email ?? ''}
            />
          </Box>
        </Flex>

        <Box>
          <Text fontSize="sm" fontWeight="medium" mb={1}>
            Address
          </Text>
          <Textarea name="address" rows={2} maxLength={500} defaultValue={entry.address ?? ''} />
        </Box>

        <Flex gap={LAYOUT_GAP.form} direction={{ base: 'column', sm: 'row' }}>
          <Box flex="1">
            <Text fontSize="sm" fontWeight="medium" mb={1}>
              Entry source
            </Text>
            <NativeSelect.Root>
              <NativeSelect.Field name="entrySource" defaultValue={entry.entry_source}>
                {Object.entries(ENTRY_SOURCE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </NativeSelect.Field>
            </NativeSelect.Root>
          </Box>
          <Box flex="1">
            <Text fontSize="sm" fontWeight="medium" mb={1}>
              Referred by promoter
            </Text>
            <NativeSelect.Root>
              <NativeSelect.Field
                name="referredByPromoterId"
                defaultValue={entry.referred_by_promoter_id ?? ''}
              >
                <option value="">None</option>
                {activePromoters.map((promoter) => (
                  <option key={promoter.id} value={promoter.id}>
                    {promoter.name}
                  </option>
                ))}
              </NativeSelect.Field>
            </NativeSelect.Root>
          </Box>
        </Flex>

        <Box>
          <Text fontSize="sm" fontWeight="medium" mb={1}>
            Notes
          </Text>
          <Textarea name="notes" rows={3} maxLength={2000} defaultValue={entry.notes ?? ''} />
        </Box>

        {roosters.length > 0 ? (
          <>
            <Text
              fontSize="sm"
              fontWeight="semibold"
              color="fg.muted"
              textTransform="uppercase"
              pt={2}
            >
              Roosters &amp; weights
            </Text>
            {roosters.map((rooster) => (
              <PanelCard key={rooster.rooster_id}>
                <Text fontSize="sm" fontWeight="medium" mb={3}>
                  Cock #{rooster.cock_number}
                  {rooster.is_paired ? (
                    <Text as="span" fontSize="xs" color="fg.muted" fontWeight="normal" ml={2}>
                      (in a match — rooster details locked)
                    </Text>
                  ) : null}
                </Text>
                <Flex gap={LAYOUT_GAP.form} direction={{ base: 'column', sm: 'row' }}>
                  <Box flex="1">
                    <Text fontSize="sm" fontWeight="medium" mb={1}>
                      Band number
                    </Text>
                    <Input
                      name={`bandNumber_${rooster.rooster_id}`}
                      required
                      maxLength={50}
                      defaultValue={rooster.band_number}
                      disabled={rooster.is_paired}
                    />
                  </Box>
                  <Box flex="1">
                    <Text fontSize="sm" fontWeight="medium" mb={1}>
                      Weight (kg)
                    </Text>
                    <Input
                      name={`weight_${rooster.rooster_id}`}
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      defaultValue={
                        rooster.weight != null ? String(rooster.weight) : ''
                      }
                      disabled={rooster.is_paired}
                    />
                  </Box>
                </Flex>
                <Flex gap={LAYOUT_GAP.form} direction={{ base: 'column', sm: 'row' }} mt={LAYOUT_GAP.form}>
                  <Box flex="1">
                    <Text fontSize="sm" fontWeight="medium" mb={1}>
                      Category
                    </Text>
                    <Input
                      name={`category_${rooster.rooster_id}`}
                      maxLength={100}
                      defaultValue={rooster.category ?? ''}
                      disabled={rooster.is_paired}
                    />
                  </Box>
                  <Box flex="1">
                    <Text fontSize="sm" fontWeight="medium" mb={1}>
                      Color / marking
                    </Text>
                    <Input
                      name={`colorMarking_${rooster.rooster_id}`}
                      maxLength={200}
                      defaultValue={rooster.color_marking ?? ''}
                      disabled={rooster.is_paired}
                    />
                  </Box>
                </Flex>
              </PanelCard>
            ))}
          </>
        ) : null}

        {formState.error ? (
          <Text fontSize="sm" color="red.500">
            {formState.error}
          </Text>
        ) : null}

        <ButtonGroup>
          <Button type="submit" loading={pending}>
            Save entry
          </Button>
          <Button asChild variant="outline">
            <Link href={`/dashboard/events/${eventId}/rooster-entries`}>Cancel</Link>
          </Button>
        </ButtonGroup>
        </Stack>
      </form>
    </PageStack>
  )
}
