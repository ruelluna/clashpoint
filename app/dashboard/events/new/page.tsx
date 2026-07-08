import { EventFormClient } from '@/features/events/components/event-form-client'
import { listPromoters } from '@/features/promoters/queries'
import { requirePermission } from '@/lib/auth/permissions'

export default async function NewEventPage() {
  await requirePermission('events.manage')
  const promoters = await listPromoters('active')

  return (
    <EventFormClient mode="create" promoters={promoters} canManage />
  )
}
