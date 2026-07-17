import { EventFormClient } from '@/features/events/components/event-form-client'
import { listPromoters } from '@/features/promoters/queries'
import { getUser } from '@/lib/auth/session'
import { hasPermission, requirePermission } from '@/lib/auth/permissions'

export default async function NewEventPage() {
  await requirePermission('events.manage')
  const [promoters, user] = await Promise.all([listPromoters('active'), getUser()])

  const canManageEligibility = user
    ? await hasPermission(user.id, 'derby_eligibility.manage')
    : false

  return (
    <EventFormClient
      mode="create"
      promoters={promoters}
      canManage
      canManageEligibility={canManageEligibility}
    />
  )
}
