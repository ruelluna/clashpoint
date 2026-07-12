import { redirect } from 'next/navigation'

type NewRegistrationRedirectProps = {
  params: Promise<{ id: string }>
}

export default async function NewRegistrationRedirectPage({
  params,
}: NewRegistrationRedirectProps) {
  const { id } = await params
  redirect(`/dashboard/events/${id}/rooster-entries/new`)
}
