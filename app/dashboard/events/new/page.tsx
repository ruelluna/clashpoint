import { EventFormClient } from '@/features/events/components/event-form-client'
import { listAssociations } from '@/features/associations/queries'
import { listPromoters } from '@/features/promoters/queries'
import { getUser } from '@/lib/auth/session'
import { hasPermission, requirePermission } from '@/lib/auth/permissions'

export default async function NewEventPage() {
  await requirePermission('events.manage')
  const [promoters, user, associations] = await Promise.all([
    listPromoters('active'),
    getUser(),
    listAssociations(),
  ])

  const canManageEligibility = user
    ? await hasPermission(user.id, 'derby_eligibility.manage')
    : false

  return (
    <EventFormClient
      mode="create"
      promoters={promoters}
      canManage
      associations={associations}
      canManageEligibility={canManageEligibility}
    />
  )
}
