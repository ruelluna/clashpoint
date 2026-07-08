import { PromoterFormClient } from '@/features/promoters/components/promoter-form-client'
import { requirePermission } from '@/lib/auth/permissions'

export default async function NewPromoterPage() {
  await requirePermission('promoters.manage')

  return <PromoterFormClient mode="create" />
}
