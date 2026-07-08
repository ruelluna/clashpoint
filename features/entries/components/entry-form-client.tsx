'use client'

import {
  Box,
  Button,
  Flex,
  Input,
  NativeSelect,
  Text,
  Textarea,
} from '@chakra-ui/react'
import Link from 'next/link'
import { useActionState } from 'react'

import {
  createEntryAction,
  type EntryActionState,
} from '@/features/entries/actions'
import { ENTRY_SOURCE_LABELS } from '@/features/entries/schema'
import type { PromoterListItem } from '@/features/promoters/types'

type EntryFormClientProps = {
  eventId: string
  eventName: string
  entryFee: number
  promoters: PromoterListItem[]
}

const initialState: EntryActionState = {}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'PHP',
  }).format(amount)
}

export function EntryFormClient({
  eventId,
  eventName,
  entryFee,
  promoters,
}: EntryFormClientProps) {
  const [formState, formAction, pending] = useActionState(
    createEntryAction,
    initialState
  )

  const activePromoters = promoters.filter((promoter) => promoter.status === 'active')

  return (
    <Box className="space-y-6" maxW="2xl">
      <Box>
        <Text fontSize="lg" fontWeight="semibold">
          New registration
        </Text>
        <Text color="fg.muted" fontSize="sm">
          {eventName} · Entry fee {formatCurrency(entryFee)}
        </Text>
      </Box>

      <form action={formAction} className="space-y-4">
        <input type="hidden" name="eventId" value={eventId} />

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

        <Flex gap={4} direction={{ base: 'column', sm: 'row' }}>
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

        <Flex gap={4} direction={{ base: 'column', sm: 'row' }}>
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

        {formState.error ? (
          <Text fontSize="sm" color="red.500">
            {formState.error}
          </Text>
        ) : null}

        <Flex gap={3}>
          <Button type="submit" loading={pending}>
            Save registration
          </Button>
          <Button asChild variant="outline">
            <Link href={`/dashboard/events/${eventId}/registrations`}>Cancel</Link>
          </Button>
        </Flex>
      </form>
    </Box>
  )
}
