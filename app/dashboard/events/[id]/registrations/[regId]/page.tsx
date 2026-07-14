import { redirect } from 'next/navigation'

type RegistrationDetailRedirectProps = {
  params: Promise<{ id: string; regId: string }>
}

export default async function RegistrationDetailRedirectPage({
  params,
}: RegistrationDetailRedirectProps) {
  const { id, regId } = await params
  redirect(`/dashboard/events/${id}/roosters?highlight=${regId}`)
}
