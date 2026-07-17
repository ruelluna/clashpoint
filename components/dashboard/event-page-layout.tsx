import 'server-only'

import { EventDetailTabs, type EventTabItem } from '@/features/events/components/event-detail-tabs'
import { getEvent } from '@/features/events/queries'
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
  const permissionTabs = user ? await getVisibleEventTabs(user.id) : undefined
  const event = await getEvent(eventId)

  const tabs = (visibleTabs ?? permissionTabs ?? []).filter((tab) => {
    if (tab.slug === 'inspection' && !event?.physical_inspection_required) {
      return false
    }
    return true
  })

  return (
    <PageStack>
      <EventDetailTabs eventId={eventId} eventName={eventName} visibleTabs={tabs} />
      {children}
    </PageStack>
  )
}
