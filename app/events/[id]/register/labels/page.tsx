import { Button, Stack, Text } from '@chakra-ui/react'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import {
  feeSettingsFromEntryFee,
  PublicRegistrationBarcodes,
} from '@/features/public/components/public-registration-barcodes'
import { PublicEventNav } from '@/features/public/components/public-event-nav'
import {
  getPublicRegistrationEvent,
  getPublicRegistrationLabels,
} from '@/features/public/queries'

type PublicRegisterLabelsPageProps = {
  params: Promise<{ id: string }>
}

export default async function PublicRegisterLabelsPage({
  params,
}: PublicRegisterLabelsPageProps) {
  const { id } = await params
  const event = await getPublicRegistrationEvent(id)
  if (!event) notFound()

  const result = await getPublicRegistrationLabels(id)

  const navEvent = {
    id: event.id,
    name: event.name,
    venue: event.venue,
    event_date: event.event_date,
    event_type: event.event_type,
    derby_type: event.derby_type,
    status: event.status,
    cocks_per_entry: event.cocks_per_entry,
    tax_per_fight: event.tax_per_fight,
    registration_rules: event.registration_rules,
    promoter_name: event.promoter_name,
    publish_matches: false,
    publish_standings: false,
    publish_winners: false,
    publish_prize_amounts: false,
    registration_open: event.registration_open,
  }

  if (!result.ok) {
    return (
      <Stack gap={6}>
        <PublicEventNav event={navEvent} />
        <Stack gap={4} borderWidth="1px" borderColor="border" rounded="lg" p={6} maxW="2xl">
          <Text fontSize="lg" fontWeight="semibold">
            Labels unavailable
          </Text>
          <Text color="fg.muted">{result.error}</Text>
          <Button asChild variant="outline" alignSelf="flex-start">
            <Link href={`/events/${id}`}>Back to event</Link>
          </Button>
        </Stack>
      </Stack>
    )
  }

  const { labels, entryFee } = result

  return (
    <Stack gap={6}>
      <PublicEventNav event={navEvent} />
      <Stack gap={4} borderWidth="1px" borderColor="border" rounded="lg" p={6} maxW="2xl">
        <Text fontSize="lg" fontWeight="semibold">
          Registration labels
        </Text>
        <Text fontSize="sm">
          Entry #{labels.entryNumber}
          {labels.bandNumbers.length > 0
            ? ` · Band number(s): ${labels.bandNumbers.join(', ')}`
            : ''}
        </Text>
        <PublicRegistrationBarcodes
          eventId={event.id}
          eventName={event.name}
          entryNumber={labels.entryNumber}
          ownerName={labels.ownerName}
          ownerBarcode={labels.ownerBarcode}
          ownerScanCode={labels.ownerScanCode}
          contactFullName={labels.contactFullName}
          contactDesignation={labels.contactDesignation}
          roosters={labels.roosters}
          feeSettings={feeSettingsFromEntryFee(entryFee)}
          showLabelsLink={false}
        />
      </Stack>
    </Stack>
  )
}
