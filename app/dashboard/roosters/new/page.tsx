import { RoosterFormClient } from '@/features/roosters/components/rooster-form-client'
import { requirePermission } from '@/lib/auth/permissions'

export default async function NewRoosterPage() {
  await requirePermission('rooster.create')

  return <RoosterFormClient mode="create" />
}
