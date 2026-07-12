import { EventDetailTabs } from '@/features/events/components/event-detail-tabs'

import { PageStack } from '@/components/dashboard/page-stack'

type EventPageLayoutProps = {
  eventId: string
  eventName: string
  children: React.ReactNode
}

export function EventPageLayout({ eventId, eventName, children }: EventPageLayoutProps) {
  return (
    <PageStack>
      <EventDetailTabs eventId={eventId} eventName={eventName} />
      {children}
    </PageStack>
  )
}
