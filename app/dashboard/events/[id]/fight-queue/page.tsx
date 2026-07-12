import { redirect } from 'next/navigation'

type FightQueueRedirectProps = {
  params: Promise<{ id: string }>
}

export default async function FightQueueRedirectPage({ params }: FightQueueRedirectProps) {
  const { id } = await params
  redirect(`/dashboard/events/${id}/matching`)
}
