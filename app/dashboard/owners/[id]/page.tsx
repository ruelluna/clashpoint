import { OwnerFormClient } from '@/features/competitors/components/owner-form-client'
import { getCompetitorDetail } from '@/features/competitors/queries'
import { requirePermission } from '@/lib/auth/permissions'
import { notFound } from 'next/navigation'

type OwnerDetailPageProps = {
  params: Promise<{ id: string }>
}

export default async function OwnerDetailPage({ params }: OwnerDetailPageProps) {
  await requirePermission('entries.manage')

  const { id } = await params
  const owner = await getCompetitorDetail(id)
  if (!owner) notFound()

  return <OwnerFormClient mode="edit" owner={owner} />
}
