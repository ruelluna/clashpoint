import 'server-only'

import type { SettlementRow } from '@/features/promoter-settlements/types'
import { createClient } from '@/lib/supabase/server'

type SettlementDbRow = {
  id: string
  settlement_reference: string
  event_id: string
  promoter_id: string
  gross_collection: number
  eligible_collection: number
  total_expenses: number
  prize_pool: number
  promoter_commission: number
  promoter_advances: number
  guaranteed_prize: number
  amount_payable: number
  amount_receivable: number
  settlement_status: SettlementRow['settlementStatus']
  settled_by: string | null
  settled_at: string | null
  notes: string | null
  created_at: string
  updated_at: string
  promoters: { name: string } | null
}

function mapSettlementRow(row: SettlementDbRow): SettlementRow {
  return {
    id: row.id,
    settlementReference: row.settlement_reference,
    eventId: row.event_id,
    promoterId: row.promoter_id,
    promoterName: row.promoters?.name ?? '—',
    grossCollection: Number(row.gross_collection),
    eligibleCollection: Number(row.eligible_collection),
    totalExpenses: Number(row.total_expenses),
    prizePool: Number(row.prize_pool),
    promoterCommission: Number(row.promoter_commission),
    promoterAdvances: Number(row.promoter_advances),
    guaranteedPrize: Number(row.guaranteed_prize),
    amountPayable: Number(row.amount_payable),
    amountReceivable: Number(row.amount_receivable),
    settlementStatus: row.settlement_status,
    settledBy: row.settled_by,
    settledAt: row.settled_at,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function getSettlementByEvent(
  eventId: string
): Promise<SettlementRow | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('promoter_settlements')
    .select(
      `
      *,
      promoters ( name )
    `
    )
    .eq('event_id', eventId)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  return mapSettlementRow(data as unknown as SettlementDbRow)
}
