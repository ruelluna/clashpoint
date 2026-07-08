import { PublicEventsList } from '@/features/public/components/public-events-list'
import { listPublicEvents } from '@/features/public/queries'

export default async function PublicEventsPage() {
  const events = await listPublicEvents()

  return <PublicEventsList events={events} />
}
