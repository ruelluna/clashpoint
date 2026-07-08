import { PortalEventsList } from '@/features/promoter-portal/components/portal-events-list'
import { listAssignedEvents } from '@/features/promoter-portal/queries'
import { requirePortalAccess } from '@/lib/auth/permissions'

export default async function PortalEventsPage() {
  const profile = await requirePortalAccess()
  const events = await listAssignedEvents(profile)

  return <PortalEventsList events={events} />
}
