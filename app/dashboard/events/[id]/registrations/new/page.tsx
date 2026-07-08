import { notFound } from 'next/navigation'
import { Box } from '@chakra-ui/react'

import { EntryFormClient } from '@/features/entries/components/entry-form-client'
import { EventDetailTabs } from '@/features/events/components/event-detail-tabs'
import { getEvent } from '@/features/events/queries'
import { listPromoters } from '@/features/promoters/queries'
import { requirePermission } from '@/lib/auth/permissions'

type NewRegistrationPageProps = {
  params: Promise<{ id: string }>
}

export default async function NewRegistrationPage({
  params,
}: NewRegistrationPageProps) {
  await requirePermission('entries.manage')
  const { id } = await params
  const [event, promoters] = await Promise.all([getEvent(id), listPromoters('active')])

  if (!event) notFound()

  return (
    <Box className="space-y-6">
      <EventDetailTabs eventId={event.id} eventName={event.name} />
      <EntryFormClient
        eventId={event.id}
        eventName={event.name}
        entryFee={event.entry_fee}
        promoters={promoters}
      />
    </Box>
  )
}
