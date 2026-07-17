import 'server-only'

import { sumPrizePoolFromPayments } from '@/features/events/prize-pool-utils'
import { createClient } from '@/lib/supabase/server'

const PRIZE_POOL_CATEGORIES = ['registration', 'rooster_entry'] as const

export { sumPrizePoolFromPayments } from '@/features/events/prize-pool-utils'

export async function getEventPrizePoolCollected(eventId: string): Promise<number> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('payments')
    .select('amount_paid, payment_category, payment_status')
    .eq('event_id', eventId)
    .in('payment_category', [...PRIZE_POOL_CATEGORIES])
    .neq('payment_status', 'refunded')

  if (error) throw error

  return sumPrizePoolFromPayments(
    (data ?? []).map((row) => ({
      amountPaid: Number(row.amount_paid),
      paymentCategory: row.payment_category as string,
      paymentStatus: row.payment_status as string,
    }))
  )
}
