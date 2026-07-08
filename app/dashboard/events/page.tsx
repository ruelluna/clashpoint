import { EventsListClient } from '@/features/events/components/events-list-client'
import { listEvents } from '@/features/events/queries'
import { getUser } from '@/lib/auth/session'
import { hasPermission, requirePermission } from '@/lib/auth/permissions'

export default async function EventsPage() {
  await requirePermission('events.view')
  const user = await getUser()
  const canManage = user ? await hasPermission(user.id, 'events.manage') : false
  const events = await listEvents()

  return <EventsListClient events={events} canManage={canManage} />
}
