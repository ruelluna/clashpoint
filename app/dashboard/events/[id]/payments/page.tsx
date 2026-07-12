import { redirect } from 'next/navigation'

type PaymentsRedirectProps = {
  params: Promise<{ id: string }>
}

export default async function PaymentsRedirectPage({ params }: PaymentsRedirectProps) {
  const { id } = await params
  redirect(`/dashboard/events/${id}/rooster-entries`)
}
