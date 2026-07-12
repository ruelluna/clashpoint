import { OwnerFormClient } from '@/features/competitors/components/owner-form-client'
import { requirePermission } from '@/lib/auth/permissions'

export default async function NewOwnerPage() {
  await requirePermission('entries.manage')

  return <OwnerFormClient mode="create" />
}
