import { redirect } from 'next/navigation'

type RoosterEntriesRedirectProps = {
  params: Promise<{ id: string }>
}

export default async function RoosterEntriesRedirectPage({
  params,
}: RoosterEntriesRedirectProps) {
  const { id } = await params
  redirect(`/dashboard/events/${id}/roosters`)
}
