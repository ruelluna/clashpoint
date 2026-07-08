import 'server-only'

import type { PayoutListItem } from '@/features/payouts/types'
import { createClient } from '@/lib/supabase/server'

type PayoutRow = {
  id: string
  payout_reference: string
  event_id: string
  entry_id: string
  rank_label: string
  rank_position: number
  amount: number
  payment_method: PayoutListItem['paymentMethod']
  recipient_name: string
  released_by: string | null
  released_at: string | null
  notes: string | null
  created_at: string
  entries: {
    entry_number: string
    entry_name: string
  } | null
}

export async function listPayoutsByEvent(eventId: string): Promise<PayoutListItem[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('prize_payouts')
    .select(
      `
      id,
      payout_reference,
      event_id,
      entry_id,
      rank_label,
      rank_position,
      amount,
      payment_method,
      recipient_name,
      released_by,
      released_at,
      notes,
      created_at,
      entries ( entry_number, entry_name )
    `
    )
    .eq('event_id', eventId)
    .order('rank_position', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) throw error

  return ((data ?? []) as unknown as PayoutRow[]).map((row) => ({
    id: row.id,
    payoutReference: row.payout_reference,
    eventId: row.event_id,
    entryId: row.entry_id,
    entryNumber: row.entries?.entry_number ?? '—',
    entryName: row.entries?.entry_name ?? '—',
    rankLabel: row.rank_label,
    rankPosition: row.rank_position,
    amount: Number(row.amount),
    paymentMethod: row.payment_method,
    recipientName: row.recipient_name,
    releasedBy: row.released_by,
    releasedAt: row.released_at,
    notes: row.notes,
    createdAt: row.created_at,
    isReleased: row.released_at != null,
  }))
}
