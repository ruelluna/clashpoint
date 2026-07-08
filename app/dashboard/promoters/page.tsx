import { PromotersListClient } from '@/features/promoters/components/promoters-list-client'
import { listPromoters } from '@/features/promoters/queries'
import { requirePermission } from '@/lib/auth/permissions'

export default async function PromotersPage() {
  await requirePermission('promoters.manage')
  const promoters = await listPromoters()

  return <PromotersListClient promoters={promoters} />
}
