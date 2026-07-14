import { redirect } from 'next/navigation'

type NewRoosterEntryRedirectProps = {
  params: Promise<{ id: string }>
}

export default async function NewRoosterEntryRedirectPage({
  params,
}: NewRoosterEntryRedirectProps) {
  const { id } = await params
  redirect(`/dashboard/events/${id}/owners/new`)
}
