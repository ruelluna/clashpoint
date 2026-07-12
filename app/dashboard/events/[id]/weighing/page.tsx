import { redirect } from 'next/navigation'

type WeighingPageProps = {
  params: Promise<{ id: string }>
}

export default async function WeighingPage({ params }: WeighingPageProps) {
  const { id } = await params
  redirect(`/dashboard/events/${id}/rooster-entries`)
}
