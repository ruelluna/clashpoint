import 'server-only'

import type { RecordRevolvingFundAdjustmentInput } from '@/features/revolving-fund/schema'
import type {
  RevolvingFundEntryType,
  RevolvingFundLedgerEntry,
} from '@/features/revolving-fund/types'
import { createClient } from '@/lib/supabase/server'

function roundMoney(value: number): number {
  return Number(value.toFixed(2))
}

type LedgerRow = {
  id: string
  event_id: string
  entry_type: RevolvingFundEntryType
  amount: number
  balance_after: number
  description: string | null
  created_by: string | null
  created_at: string
}

function mapLedgerRow(row: LedgerRow): RevolvingFundLedgerEntry {
  return {
    id: row.id,
    eventId: row.event_id,
    entryType: row.entry_type,
    amount: Number(row.amount),
    balanceAfter: Number(row.balance_after),
    description: row.description,
    createdBy: row.created_by,
    createdAt: row.created_at,
  }
}

async function getLatestBalance(
  supabase: Awaited<ReturnType<typeof createClient>>,
  eventId: string
): Promise<number> {
  const { data, error } = await supabase
    .from('event_revolving_fund_ledger')
    .select('balance_after')
    .eq('event_id', eventId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw error
  return data ? Number(data.balance_after) : 0
}

export async function createOpeningLedgerEntry(
  actorId: string,
  eventId: string,
  initialAmount: number
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const amount = roundMoney(Math.max(0, initialAmount))

  const { error } = await supabase.from('event_revolving_fund_ledger').insert({
    event_id: eventId,
    entry_type: 'opening',
    amount,
    balance_after: amount,
    description: 'Opening revolving fund balance',
    created_by: actorId,
  })

  if (error) return { error: error.message }
  return {}
}

export async function listRevolvingFundLedger(
  eventId: string
): Promise<RevolvingFundLedgerEntry[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('event_revolving_fund_ledger')
    .select('*')
    .eq('event_id', eventId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return ((data ?? []) as LedgerRow[]).map(mapLedgerRow)
}

export async function getRevolvingFundBalance(eventId: string): Promise<number> {
  const supabase = await createClient()
  return getLatestBalance(supabase, eventId)
}

export async function recordRevolvingFundAdjustment(
  actorId: string,
  input: RecordRevolvingFundAdjustmentInput
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const amount = roundMoney(input.amount)
  const currentBalance = await getLatestBalance(supabase, input.eventId)
  const balanceAfter = roundMoney(currentBalance + amount)

  const { error } = await supabase.from('event_revolving_fund_ledger').insert({
    event_id: input.eventId,
    entry_type: 'adjustment',
    amount,
    balance_after: balanceAfter,
    description: input.description.trim(),
    created_by: actorId,
  })

  if (error) return { error: error.message }
  return {}
}
