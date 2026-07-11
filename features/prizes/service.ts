import 'server-only'

import type { EventWithPrize } from '@/features/events/types'
import type { PrizeAllocation, PrizePoolBreakdown } from '@/features/prizes/types'
import {
  computePrizePool,
  distributePrizes,
  type WinnerForPrize,
} from '@/features/prizes/utils'
import type { CommissionType } from '@/features/promoters/types'
import { createClient } from '@/lib/supabase/server'

export type { PrizePoolBreakdown, PrizeAllocation } from '@/features/prizes/types'

export async function countEligibleEntries(eventId: string): Promise<number> {
  const supabase = await createClient()
  const { count, error } = await supabase
    .from('entries')
    .select('id', { count: 'exact', head: true })
    .eq('event_id', eventId)
    .in('registration_status', ['approved', 'confirmed'])
    .is('deleted_at', null)

  if (error) throw error
  return count ?? 0
}

export async function computePrizePoolForEvent(
  event: EventWithPrize,
  entryCount?: number
): Promise<PrizePoolBreakdown> {
  const count = entryCount ?? (await countEligibleEntries(event.id))
  let promoterCommissionType: CommissionType = 'none'
  let promoterCommissionValue: number | null = null

  if (event.promoter_id) {
    const supabase = await createClient()
    const { data: promoter, error } = await supabase
      .from('promoters')
      .select('commission_type, commission_value')
      .eq('id', event.promoter_id)
      .is('deleted_at', null)
      .maybeSingle()

    if (error) throw error
    if (promoter) {
      promoterCommissionType = promoter.commission_type as CommissionType
      promoterCommissionValue =
        promoter.commission_value != null ? Number(promoter.commission_value) : null
    }
  }

  return computePrizePool({
    entryCount: count,
    entryFee: event.entry_fee,
    promoterCommissionType,
    promoterCommissionValue,
  })
}

export function distributePrizesFromStructure(
  event: EventWithPrize,
  prizePool: number,
  winners: WinnerForPrize[]
): PrizeAllocation[] {
  if (!event.prize_structure) return []

  return distributePrizes(
    {
      prizeType: event.prize_structure.prize_type,
      config: event.prize_structure.config,
    },
    prizePool,
    winners
  )
}
