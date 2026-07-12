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

import { ButtonGroup, LAYOUT_GAP, PageHeader, PageStack } from '@/components/dashboard'
import {
  createEntryAction,
  type EntryActionState,
} from '@/features/entries/actions'
import { ENTRY_SOURCE_LABELS } from '@/features/entries/schema'
import type { PromoterListItem } from '@/features/promoters/types'

type EntryFormClientProps = {
  eventId: string
  eventName: string
  promoters: PromoterListItem[]
  cocksPerEntry: number
  minWeight: number | null
  maxWeight: number | null
}

const initialState: EntryActionState = {}

function formatWeightRange(minWeight: number | null, maxWeight: number | null) {
  if (minWeight == null && maxWeight == null) return 'No weight limits configured'
  return `${minWeight ?? '—'} – ${maxWeight ?? '—'} kg`
}

export function EntryFormClient({
  eventId,
  eventName,
  promoters,
  cocksPerEntry,
  minWeight,
  maxWeight,
}: EntryFormClientProps) {
  const [formState, formAction, pending] = useActionState(
    createEntryAction,
    initialState
  )

  const activePromoters = promoters.filter((promoter) => promoter.status === 'active')

  return (
    <PageStack maxW="2xl">
      <PageHeader
        title="New rooster entry"
        description={`${eventName} · Register owner and first cock (${cocksPerEntry} per entry max). Weight limits: ${formatWeightRange(minWeight, maxWeight)}`}
      />

      <form action={formAction}>
        <Stack gap={LAYOUT_GAP.form}>
        <input type="hidden" name="eventId" value={eventId} />

        <Text fontSize="sm" fontWeight="semibold" color="fg.muted" textTransform="uppercase">
          Owner / handler
        </Text>

        <Box>
          <Text fontSize="sm" fontWeight="medium" mb={1}>
            Entry name
          </Text>
          <Input name="entryName" required maxLength={200} />
        </Box>

        <Box>
          <Text fontSize="sm" fontWeight="medium" mb={1}>
            Owner name
          </Text>
          <Input name="ownerName" required maxLength={200} />
        </Box>

        <Box>
          <Text fontSize="sm" fontWeight="medium" mb={1}>
            Handler name
          </Text>
          <Input name="handlerName" maxLength={200} />
        </Box>

        <Flex gap={LAYOUT_GAP.form} direction={{ base: 'column', sm: 'row' }}>
          <Box flex="1">
            <Text fontSize="sm" fontWeight="medium" mb={1}>
              Contact number
            </Text>
            <Input name="contactNumber" maxLength={50} />
          </Box>
          <Box flex="1">
            <Text fontSize="sm" fontWeight="medium" mb={1}>
              Email
            </Text>
            <Input name="email" type="email" maxLength={200} />
          </Box>
        </Flex>

        <Box>
          <Text fontSize="sm" fontWeight="medium" mb={1}>
            Address
          </Text>
          <Textarea name="address" rows={2} maxLength={500} />
        </Box>

        <Flex gap={LAYOUT_GAP.form} direction={{ base: 'column', sm: 'row' }}>
          <Box flex="1">
            <Text fontSize="sm" fontWeight="medium" mb={1}>
              Entry source
            </Text>
            <NativeSelect.Root>
              <NativeSelect.Field name="entrySource" defaultValue="staff_encoded">
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
              <NativeSelect.Field name="referredByPromoterId" defaultValue="">
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
          <Textarea name="notes" rows={3} maxLength={2000} />
        </Box>

        <Text
          fontSize="sm"
          fontWeight="semibold"
          color="fg.muted"
          textTransform="uppercase"
          pt={2}
        >
          Rooster &amp; weight
        </Text>

        <Flex gap={LAYOUT_GAP.form} direction={{ base: 'column', sm: 'row' }}>
          <Box flex="1">
            <Text fontSize="sm" fontWeight="medium" mb={1}>
              Band number
            </Text>
            <Input name="bandNumber" required maxLength={50} />
          </Box>
          <Box flex="1">
            <Text fontSize="sm" fontWeight="medium" mb={1}>
              Weight (kg)
            </Text>
            <Input name="weight" type="number" step="0.01" min="0" required />
          </Box>
        </Flex>

        <Flex gap={LAYOUT_GAP.form} direction={{ base: 'column', sm: 'row' }}>
          <Box flex="1">
            <Text fontSize="sm" fontWeight="medium" mb={1}>
              Category
            </Text>
            <Input name="category" maxLength={100} />
          </Box>
          <Box flex="1">
            <Text fontSize="sm" fontWeight="medium" mb={1}>
              Color / marking
            </Text>
            <Input name="colorMarking" maxLength={200} />
          </Box>
        </Flex>

        {formState.error ? (
          <Text fontSize="sm" color="red.500">
            {formState.error}
          </Text>
        ) : null}

        <ButtonGroup mt={LAYOUT_GAP.form}>
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
