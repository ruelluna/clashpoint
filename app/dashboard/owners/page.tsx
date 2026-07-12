import { redirect } from 'next/navigation'

import { OwnersListClient } from '@/features/competitors/components/owners-list-client'
import { listCompetitors } from '@/features/competitors/queries'
import { getUser } from '@/lib/auth/session'
import { hasAnyPermission, hasPermission } from '@/lib/auth/permissions'

export default async function OwnersPage() {
  const user = await getUser()
  if (!user) redirect('/login')

  const canView = await hasAnyPermission(user.id, ['entries.manage', 'rooster.view'])
  if (!canView) redirect('/access-denied')

  const owners = await listCompetitors({ search: '', limit: 100, offset: 0 })
  const canManage = await hasPermission(user.id, 'entries.manage')

  return <OwnersListClient owners={owners} canManage={canManage} />
}
