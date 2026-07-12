import { notFound } from 'next/navigation'

import { RoosterProfileClient } from '@/features/roosters/components/rooster-profile-client'
import {
  countRoosterFightStats,
  getRoosterWithBands,
  listRoosterParticipations,
} from '@/features/roosters/queries'
import { getUser } from '@/lib/auth/session'
import { hasPermission, requirePermission } from '@/lib/auth/permissions'

type RoosterProfilePageProps = {
  params: Promise<{ id: string }>
}

export default async function RoosterProfilePage({ params }: RoosterProfilePageProps) {
  await requirePermission('rooster.view')
  const { id } = await params

  const [rooster, participations, fightStats, user] = await Promise.all([
    getRoosterWithBands(id),
    listRoosterParticipations(id),
    countRoosterFightStats(id),
    getUser(),
  ])

  if (!rooster) notFound()

  const canUpdate = user ? await hasPermission(user.id, 'rooster.update') : false

  return (
    <RoosterProfileClient
      rooster={rooster}
      participations={participations}
      fightStats={fightStats}
      canUpdate={canUpdate}
    />
  )
}
