import { RoostersListClient } from '@/features/roosters/components/roosters-list-client'
import { listRoosters } from '@/features/roosters/queries'
import { getUser } from '@/lib/auth/session'
import { hasPermission, requirePermission } from '@/lib/auth/permissions'

export default async function RoostersPage() {
  await requirePermission('rooster.view')
  const [roosters, user] = await Promise.all([listRoosters(), getUser()])
  const canCreate = user ? await hasPermission(user.id, 'rooster.create') : false

  return <RoostersListClient roosters={roosters} canCreate={canCreate} />
}
