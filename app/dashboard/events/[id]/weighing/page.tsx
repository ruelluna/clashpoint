import { redirect } from 'next/navigation'

type WeighingRedirectProps = {
  params: Promise<{ id: string }>
}

export default async function WeighingRedirectPage({ params }: WeighingRedirectProps) {
  const { id } = await params
  redirect(`/dashboard/events/${id}/roosters`)
}
