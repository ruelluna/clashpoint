import { redirect } from 'next/navigation'

type WeighingPrintRedirectProps = {
  params: Promise<{ id: string; registrationId: string }>
}

export default async function WeighingPrintRedirectPage({
  params,
}: WeighingPrintRedirectProps) {
  const { id, registrationId } = await params
  redirect(`/dashboard/events/${id}/roosters/${registrationId}/print`)
}
