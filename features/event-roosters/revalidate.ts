import 'server-only'

import { revalidatePath } from 'next/cache'

export function revalidateEventRoostersPaths(eventId: string) {
  revalidatePath(`/dashboard/events/${eventId}/owners`)
  revalidatePath(`/dashboard/events/${eventId}/roosters`)
  revalidatePath(`/dashboard/events/${eventId}/inspection`)
  revalidatePath(`/dashboard/events/${eventId}/matching`)
  revalidatePath(`/dashboard/events/${eventId}/reports/weighing`)
  revalidatePath('/dashboard/audit')
}
