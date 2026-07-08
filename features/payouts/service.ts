import 'server-only'

import { writeAuditLog } from '@/features/audit/service'
import type { RecordPayoutInput } from '@/features/payouts/schema'
import { createClient } from '@/lib/supabase/server'

export async function recordPayout(
  actorId: string,
  input: RecordPayoutInput
): Promise<{ error?: string }> {
  const supabase = await createClient()

  const { data: payout, error: fetchError } = await supabase
    .from('prize_payouts')
    .select(
      'id, payout_reference, event_id, entry_id, rank_label, amount, released_at, recipient_name'
    )
    .eq('id', input.payoutId)
    .eq('event_id', input.eventId)
    .maybeSingle()

  if (fetchError) return { error: fetchError.message }
  if (!payout) return { error: 'Payout not found' }
  if (payout.released_at) return { error: 'Payout is already released' }

  const releasedAt = new Date().toISOString()
  const { error } = await supabase
    .from('prize_payouts')
    .update({
      payment_method: input.paymentMethod,
      released_by: actorId,
      released_at: releasedAt,
      notes: input.notes ?? null,
    })
    .eq('id', input.payoutId)

  if (error) return { error: error.message }

  await writeAuditLog({
    actorId,
    action: 'payout.released',
    entityType: 'prize_payout',
    entityId: input.payoutId,
    oldValues: {
      payout_reference: payout.payout_reference,
      released_at: payout.released_at,
    },
    newValues: {
      payout_reference: payout.payout_reference,
      event_id: payout.event_id,
      entry_id: payout.entry_id,
      rank_label: payout.rank_label,
      amount: payout.amount,
      recipient_name: payout.recipient_name,
      payment_method: input.paymentMethod,
      released_at: releasedAt,
    },
    reason: input.notes,
  })

  return {}
}
