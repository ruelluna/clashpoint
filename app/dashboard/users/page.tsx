import { listUsers } from '@/features/users/queries'
import { UsersPageClient } from '@/features/users/components/users-page-client'
import { requirePermission } from '@/lib/auth/permissions'

export default async function UsersPage() {
  await requirePermission('users.manage')
  const users = await listUsers()

  return <UsersPageClient users={users} />
}
