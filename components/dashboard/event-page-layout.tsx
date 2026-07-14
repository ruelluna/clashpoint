import 'server-only'

import { EventDetailTabs, type EventTabItem } from '@/features/events/components/event-detail-tabs'
import { getVisibleEventTabs } from '@/lib/auth/event-tabs'
import { getUser } from '@/lib/auth/session'

import { PageStack } from '@/components/dashboard/page-stack'

type EventPageLayoutProps = {
  eventId: string
  eventName: string
  visibleTabs?: EventTabItem[]
  children: React.ReactNode
}

export async function EventPageLayout({
  eventId,
  eventName,
  visibleTabs,
  children,
}: EventPageLayoutProps) {
  const user = await getUser()
  const tabs =
    visibleTabs ?? (user ? await getVisibleEventTabs(user.id) : undefined)

  return (
    <PageStack>
      <EventDetailTabs eventId={eventId} eventName={eventName} visibleTabs={tabs} />
      {children}
    </PageStack>
  )
}
