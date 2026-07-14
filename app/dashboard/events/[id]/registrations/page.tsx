import { redirect } from 'next/navigation'

type RegistrationsRedirectProps = {
  params: Promise<{ id: string }>
}

export default async function RegistrationsRedirectPage({
  params,
}: RegistrationsRedirectProps) {
  const { id } = await params
  redirect(`/dashboard/events/${id}/roosters`)
}
