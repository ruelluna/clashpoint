import 'server-only'

import { writeAuditLog } from '@/features/audit/service'
import { promoteInspectionClearedAfterPayment } from '@/features/inspection/service'
import type { EntryFeeSnapshot } from '@/features/events/fee-utils'
import {
  computeCategoryAmountDue,
  computeEntryTotalDue,
  resolveEntryFeeSettings,
  type PaymentCategory,
} from '@/features/payments/fee-calc'
import {
  classifyCashierQuery,
  computeOutstandingDues,
  getRegistrationDuesOutstanding,
  REGISTRATION_DUES_CATEGORIES,
  splitRegistrationDuesPayment,
  type EntryOutstandingDues,
} from '@/features/payments/dues'
import {
  buildBatchReceiptLine,
  deriveEntryPaymentStatus,
} from '@/features/payments/batch-receipt'
import { buildRefundBatchReceiptLine } from '@/features/payments/batch-refund-receipt'
import {
  CASH_BOND_PAID_DISPLAY_LABEL,
  evaluateCashBondRefundEligibility,
  type CashBondRefundEligibility,
} from '@/features/payments/cash-bond-refund'
import { getPaymentRefundEligibility } from '@/features/payments/refund-eligibility'
import {
  calculateBalance,
  getNextPaymentReference,
  type RecordMatchBetPartialRefundInput,
  type RecordMatchBetPaymentInput,
  type RecordMatchBetTopUpInput,
  type RecordPaymentInput,
  type RefundPaymentInput,
  type RefundSelectedPaymentsInput,
} from '@/features/payments/schema'
import {
  allocateSplitPaymentTender,
  clearedTenderFieldsForRefund,
  roundMoney,
} from '@/features/payments/tender'
import type { PaymentStatus } from '@/features/entries/types'
import type { MatchBetPaymentStatus } from '@/features/matches/types'
import { FIGHT_QUEUE_STATUS_LABELS } from '@/features/matches/schema'
import {
  BLOCKED_BET_EDIT_QUEUE_STATUSES,
  getMatchBetAdjustmentDelta,
  isMatchBetSideSettled,
  roundMatchMoney,
} from '@/features/matches/utils'
import type {
  CashierLookupResult,
  CashierSelectableEntry,
  CashierTargetMatch,
  MatchBetCashierTarget,
  PaymentBatchReceiptItem,
  PaymentBatchReceiptLine,
  PaymentLedgerItem,
  PaymentRefundBatchReceiptItem,
} from '@/features/payments/types'
import { postRevolvingFundLedgerEntry } from '@/features/revolving-fund/service'
import { createClient } from '@/lib/supabase/server'
import {
  aggregateAdjustmentCollectDue,
  aggregatePaidByCategoryForEntries,
  aggregateRoosterCounts,
  buildCashierSelectableEntry,
} from '@/features/payments/cashier-selectable'

export { calculateBalance } from '@/features/payments/schema'
export type { EntryOutstandingDues } from '@/features/payments/dues'
export type { CashierSelectableEntry } from '@/features/payments/types'
export type { CashBondRefundEligibility } from '@/features/payments/cash-bond-refund'

type PaymentLedgerRow = {
  id: string
  payment_reference: string
  entry_id: string
  amount_due: number
  amount_paid: number
  amount_tendered: number | null
  change_given: number | null
  balance: number
  payment_method: string | null
  receipt_number: string | null
  payment_status: PaymentStatus
  payment_category: PaymentCategory
  match_id: string | null
  fight_side: 'meron' | 'wala' | null
  paid_at: string | null
  notes: string | null
  created_at: string
  updated_at: string
  cashier_session_id: string | null
  collection_batch_id: string | null
  refund_batch_id: string | null
  refunded_amount: number | null
  entries: {
    entry_number: string
    entry_name: string
    owner_name: string
  } | null
  match_bets: { barcode: string } | null
  matches: { fight_number: number } | null
  cashier_sessions: {
    opened_at: string
    profiles: { display_name: string | null } | null
  } | null
}

function mapPaymentLedgerRow(row: PaymentLedgerRow) {
  return {
    id: row.id,
    paymentReference: row.payment_reference,
    entryId: row.entry_id,
    entryNumber: row.entries?.entry_number ?? '—',
    entryName: row.entries?.entry_name ?? '—',
    ownerName: row.entries?.owner_name ?? '—',
    amountDue: Number(row.amount_due),
    amountPaid: Number(row.amount_paid),
    amountTendered: row.amount_tendered != null ? Number(row.amount_tendered) : null,
    changeGiven: row.change_given != null ? Number(row.change_given) : null,
    balance: Number(row.balance),
    paymentMethod: row.payment_method,
    receiptNumber: row.receipt_number,
    paymentStatus: row.payment_status,
    paymentCategory: row.payment_category,
    paidAt: row.paid_at,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    cashierSessionId: row.cashier_session_id,
    cashierName: row.cashier_sessions?.profiles?.display_name ?? null,
    collectionBatchId: row.collection_batch_id ?? null,
    refundBatchId: row.refund_batch_id ?? null,
    refundedAmount: row.refunded_amount != null ? Number(row.refunded_amount) : null,
    sessionOpenedAt: row.cashier_sessions?.opened_at ?? null,
    matchId: row.match_id,
    fightSide: row.fight_side,
    fightNumber: row.matches?.fight_number != null ? Number(row.matches.fight_number) : null,
    betBarcode: row.match_bets?.barcode ?? null,
  }
}

export type { PaymentLedgerItem } from '@/features/payments/types'

export async function listPaymentsByEvent(eventId: string): Promise<PaymentLedgerItem[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('payments')
    .select(
      `
      id,
      payment_reference,
      entry_id,
      amount_due,
      amount_paid,
      amount_tendered,
      change_given,
      balance,
      payment_method,
      receipt_number,
      payment_status,
      payment_category,
      paid_at,
      notes,
      created_at,
      updated_at,
      cashier_session_id,
      collection_batch_id,
      refund_batch_id,
      refunded_amount,
      match_id,
      fight_side,
      entries ( entry_number, entry_name, owner_name ),
      match_bets!payments_match_bet_id_fkey ( barcode ),
      matches ( fight_number ),
      cashier_sessions (
        opened_at,
        profiles!cashier_sessions_staff_user_id_fkey ( display_name )
      )
    `
    )
    .eq('event_id', eventId)
    .order('created_at', { ascending: false })

  if (error) throw error

  return ((data ?? []) as unknown as PaymentLedgerRow[]).map((row) => {
    const mapped = mapPaymentLedgerRow(row)
    return {
      id: mapped.id,
      paymentReference: mapped.paymentReference,
      entryId: mapped.entryId,
      entryNumber: mapped.entryNumber,
      entryName: mapped.entryName,
      ownerName: mapped.ownerName,
      amountDue: mapped.amountDue,
      amountPaid: mapped.amountPaid,
      amountTendered: mapped.amountTendered,
      changeGiven: mapped.changeGiven,
      balance: mapped.balance,
      paymentMethod: mapped.paymentMethod,
      receiptNumber: mapped.receiptNumber,
      paymentStatus: mapped.paymentStatus,
      paymentCategory: mapped.paymentCategory,
      paidAt: mapped.paidAt,
      notes: mapped.notes,
      createdAt: mapped.createdAt,
      updatedAt: mapped.updatedAt,
      cashierSessionId: mapped.cashierSessionId,
      cashierName: mapped.cashierName,
      collectionBatchId: mapped.collectionBatchId,
      refundBatchId: mapped.refundBatchId,
      refundedAmount: mapped.refundedAmount,
      matchId: mapped.matchId,
      fightSide: mapped.fightSide,
      fightNumber: mapped.fightNumber,
      betBarcode: mapped.betBarcode,
    }
  })
}

async function listPaymentReferencesForEvent(eventId: string): Promise<string[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('payments')
    .select('payment_reference')
    .eq('event_id', eventId)

  if (error) throw error
  return (data ?? []).map((row) => row.payment_reference as string)
}

async function getEntryPaymentTotals(
  entryId: string
): Promise<{ totalPaid: number; error?: string }> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('payments')
    .select('amount_paid, payment_status')
    .eq('entry_id', entryId)
    .neq('payment_status', 'refunded')

  if (error) return { totalPaid: 0, error: error.message }

  const totalPaid = (data ?? []).reduce(
    (sum, row) => sum + Number(row.amount_paid),
    0
  )

  return { totalPaid }
}

export async function updateEntryPaymentStatus(
  entryId: string,
  amountDue: number
): Promise<{ error?: string; paymentStatus?: PaymentStatus }> {
  const supabase = await createClient()
  const { totalPaid, error: totalsError } = await getEntryPaymentTotals(entryId)

  if (totalsError) return { error: totalsError }

  const { paymentStatus } = calculateBalance(amountDue, totalPaid)

  const { data: updated, error } = await supabase
    .from('entries')
    .update({ payment_status: paymentStatus })
    .eq('id', entryId)
    .select('id')
    .maybeSingle()

  if (error) return { error: error.message }
  if (!updated) return { error: 'Failed to update entry payment status' }

  return { paymentStatus }
}

async function syncRegistrationPaymentStatus(
  entryId: string,
  paymentStatus: PaymentStatus
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const regPaymentStatus =
    paymentStatus === 'paid'
      ? 'paid'
      : paymentStatus === 'partial'
        ? 'partial'
        : paymentStatus === 'refunded'
          ? 'refunded'
          : 'unpaid'

  const { error } = await supabase
    .from('rooster_event_registrations')
    .update({ reg_payment_status: regPaymentStatus })
    .eq('entry_id', entryId)

  if (error) return { error: error.message }

  if (regPaymentStatus === 'paid') {
    await promoteInspectionClearedAfterPayment(entryId)
  }

  return {}
}

async function getEntryAmountDue(
  entryId: string,
  eventId: string,
  category: PaymentCategory = 'legacy'
): Promise<{ error?: string; amountDue?: number }> {
  const supabase = await createClient()

  const { data: entry, error: entryError } = await supabase
    .from('entries')
    .select('fee_snapshot')
    .eq('id', entryId)
    .eq('event_id', eventId)
    .maybeSingle()

  if (entryError) return { error: entryError.message }
  if (!entry) return { error: 'Entry not found' }

  const { data: event, error: eventError } = await supabase
    .from('events')
    .select(
      'entry_fee, registration_fee_enabled, registration_fee_amount, rooster_entry_fee_enabled, rooster_entry_fee_amount, cash_bond_enabled, cash_bond_amount'
    )
    .eq('id', eventId)
    .maybeSingle()

  if (eventError) return { error: eventError.message }
  if (!event) return { error: 'Event not found' }

  const { count, error: countError } = await supabase
    .from('rooster_event_registrations')
    .select('id', { count: 'exact', head: true })
    .eq('entry_id', entryId)

  if (countError) return { error: countError.message }

  const settings = resolveEntryFeeSettings(
    event,
    entry.fee_snapshot as EntryFeeSnapshot | null
  )

  const roosterCount = count ?? 0
  const amountDue =
    category === 'legacy'
      ? computeEntryTotalDue(settings, roosterCount)
      : computeCategoryAmountDue(category, settings, roosterCount)

  return { amountDue }
}

async function getEntryCategoryPaid(
  entryId: string,
  category: PaymentCategory
): Promise<{ totalPaid: number; error?: string }> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('payments')
    .select('amount_paid, payment_status')
    .eq('entry_id', entryId)
    .eq('payment_category', category)
    .neq('payment_status', 'refunded')

  if (error) return { totalPaid: 0, error: error.message }

  const totalPaid = (data ?? []).reduce(
    (sum, row) => sum + Number(row.amount_paid),
    0
  )

  return { totalPaid }
}

export async function recordPayment(
  actorId: string,
  input: RecordPaymentInput,
  cashierSessionId: string
): Promise<{
  error?: string
  paymentId?: string
  paymentIds?: string[]
  paymentCategories?: PaymentCategory[]
  collectionBatchId?: string
}> {
  if (input.collectRegistrationDues) {
    return recordSplitRegistrationDuesPayment(actorId, input, cashierSessionId)
  }

  const supabase = await createClient()

  const { data: entry, error: entryError } = await supabase
    .from('entries')
    .select('id, event_id, entry_number, entry_name, registration_status, payment_status')
    .eq('id', input.entryId)
    .eq('event_id', input.eventId)
    .is('deleted_at', null)
    .maybeSingle()

  if (entryError) return { error: entryError.message }
  if (!entry) return { error: 'Entry not found' }

  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('id')
    .eq('id', input.eventId)
    .is('deleted_at', null)
    .maybeSingle()

  if (eventError) return { error: eventError.message }
  if (!event) return { error: 'Event not found' }

  const category = input.paymentCategory ?? 'legacy'

  if (category === 'entry_fees') {
    return { error: 'Combined entry fees are no longer collected. Use entry fee collection instead.' }
  }

  let amountDue: number
  let projectedTotal: number
  let balance: number
  let paymentStatus: PaymentStatus

  const dueResult = await getEntryAmountDue(input.entryId, input.eventId, category)
  if (dueResult.error) return { error: dueResult.error }

  amountDue = dueResult.amountDue ?? 0
  const { totalPaid: existingPaid, error: totalsError } =
    category === 'legacy'
      ? await getEntryPaymentTotals(input.entryId)
      : await getEntryCategoryPaid(input.entryId, category)

  if (totalsError) return { error: totalsError }

  projectedTotal = existingPaid + input.amountPaid
  ;({ balance, paymentStatus } = calculateBalance(amountDue, projectedTotal))

  if (projectedTotal > amountDue) {
    return { error: 'Payment exceeds the amount due for this category' }
  }

  const references = await listPaymentReferencesForEvent(input.eventId)
  const paymentReference = getNextPaymentReference(input.eventId, references)

  const { data, error } = await supabase
    .from('payments')
    .insert({
      payment_reference: paymentReference,
      entry_id: input.entryId,
      event_id: input.eventId,
      amount_due: amountDue,
      amount_paid: input.amountPaid,
      amount_tendered: input.amountTendered ?? null,
      change_given: input.changeGiven ?? null,
      balance,
      payment_method: input.paymentMethod,
      receipt_number: input.receiptNumber ?? null,
      payment_status: paymentStatus,
      payment_category: category,
      received_by: actorId,
      cashier_session_id: cashierSessionId,
      paid_at: new Date().toISOString(),
      notes: input.notes ?? null,
    })
    .select('id')
    .single()

  if (error || !data) {
    return { error: error?.message ?? 'Failed to record payment' }
  }

  const statusResult = await updateEntryPaymentStatus(
    input.entryId,
    (await getEntryAmountDue(input.entryId, input.eventId, 'legacy')).amountDue ?? 0
  )
  if (statusResult.error) return { error: statusResult.error }

  if (statusResult.paymentStatus) {
    const syncResult = await syncRegistrationPaymentStatus(
      input.entryId,
      statusResult.paymentStatus
    )
    if (syncResult.error) return { error: syncResult.error }
  }

  await writeAuditLog({
    actorId,
    action: 'payment.recorded',
    entityType: 'payment',
    entityId: data.id,
    newValues: {
      payment_reference: paymentReference,
      entry_id: input.entryId,
      entry_number: entry.entry_number,
      entry_name: entry.entry_name,
      amount_paid: input.amountPaid,
      amount_tendered: input.amountTendered ?? null,
      change_given: input.changeGiven ?? null,
      balance,
      payment_status: paymentStatus,
      cashier_session_id: cashierSessionId,
    },
  })

  const fundResult = await postRevolvingFundLedgerEntry({
    eventId: input.eventId,
    amount: input.amountPaid,
    entryType: 'collection',
    description: `Collection ${paymentReference} — ${entry.entry_name}`,
    actorId,
    sourcePaymentId: data.id,
  })
  if (fundResult.error) return { error: fundResult.error }

  const { promoteMatchesForEntry } = await import('@/features/matches/promotion')
  await promoteMatchesForEntry(input.eventId, input.entryId, actorId)

  return { paymentId: data.id, paymentIds: [data.id], paymentCategories: [category] }
}

async function recordSplitRegistrationDuesPayment(
  actorId: string,
  input: RecordPaymentInput,
  cashierSessionId: string
): Promise<{
  error?: string
  paymentId?: string
  paymentIds?: string[]
  paymentCategories?: PaymentCategory[]
  collectionBatchId?: string
}> {
  const supabase = await createClient()

  const { data: entry, error: entryError } = await supabase
    .from('entries')
    .select('id, event_id, entry_number, entry_name, registration_status, payment_status')
    .eq('id', input.entryId)
    .eq('event_id', input.eventId)
    .is('deleted_at', null)
    .maybeSingle()

  if (entryError) return { error: entryError.message }
  if (!entry) return { error: 'Entry not found' }

  const duesResult = await getEntryOutstandingDues(input.eventId, input.entryId)
  if (duesResult.error || !duesResult.dues) {
    return { error: duesResult.error ?? 'Could not load entry dues' }
  }

  const combinedOutstanding = getRegistrationDuesOutstanding(duesResult.dues.lines)
  if (combinedOutstanding <= 0) {
    return { error: 'No registration dues are outstanding' }
  }
  if (input.amountPaid > combinedOutstanding) {
    return { error: 'Payment exceeds the amount due for registration dues' }
  }

  const split = splitRegistrationDuesPayment(input.amountPaid, duesResult.dues.lines)
  const portions: Array<{ category: PaymentCategory; amount: number }> = []
  if (split.registration > 0) {
    portions.push({ category: 'registration', amount: split.registration })
  }
  if (split.rooster_entry > 0) {
    portions.push({ category: 'rooster_entry', amount: split.rooster_entry })
  }
  if (split.cash_bond > 0) {
    portions.push({ category: 'cash_bond', amount: split.cash_bond })
  }
  if (portions.length === 0) {
    return { error: 'No registration dues amount to collect' }
  }

  const collectionBatchId = crypto.randomUUID()
  let references = await listPaymentReferencesForEvent(input.eventId)
  const paymentIds: string[] = []
  const paidAt = new Date().toISOString()
  const tenderByRow = allocateSplitPaymentTender(
    portions.map((portion) => portion.amount),
    input.amountTendered,
    input.changeGiven
  )

  for (const [index, portion] of portions.entries()) {
    const line = duesResult.dues.lines.find((item) => item.category === portion.category)
    if (!line) continue

    const { totalPaid: existingPaid, error: totalsError } = await getEntryCategoryPaid(
      input.entryId,
      portion.category
    )
    if (totalsError) return { error: totalsError }

    const amountDue = line.amountDue
    const projectedTotal = existingPaid + portion.amount
    const { balance, paymentStatus } = calculateBalance(amountDue, projectedTotal)

    if (projectedTotal > amountDue) {
      return { error: 'Payment exceeds the amount due for this category' }
    }

    const paymentReference = getNextPaymentReference(input.eventId, references)
    references = [...references, paymentReference]

    const { amountTendered: rowTendered, changeGiven: rowChange } =
      tenderByRow[index] ?? { amountTendered: null, changeGiven: null }

    const { data, error } = await supabase
      .from('payments')
      .insert({
        payment_reference: paymentReference,
        entry_id: input.entryId,
        event_id: input.eventId,
        amount_due: amountDue,
        amount_paid: portion.amount,
        amount_tendered: rowTendered,
        change_given: rowChange,
        balance,
        payment_method: input.paymentMethod,
        receipt_number: input.receiptNumber ?? null,
        payment_status: paymentStatus,
        payment_category: portion.category,
        received_by: actorId,
        cashier_session_id: cashierSessionId,
        collection_batch_id: collectionBatchId,
        paid_at: paidAt,
        notes: input.notes ?? null,
      })
      .select('id')
      .single()

    if (error || !data) {
      return { error: error?.message ?? 'Failed to record payment' }
    }

    paymentIds.push(data.id)

    await writeAuditLog({
      actorId,
      action: 'payment.recorded',
      entityType: 'payment',
      entityId: data.id,
      newValues: {
        payment_reference: paymentReference,
        entry_id: input.entryId,
        entry_number: entry.entry_number,
        entry_name: entry.entry_name,
        amount_paid: portion.amount,
        amount_tendered: rowTendered,
        change_given: rowChange,
        balance,
        payment_status: paymentStatus,
        payment_category: portion.category,
        cashier_session_id: cashierSessionId,
        collection_batch_id: collectionBatchId,
      },
    })

    const fundResult = await postRevolvingFundLedgerEntry({
      eventId: input.eventId,
      amount: portion.amount,
      entryType: 'collection',
      description: `Collection ${paymentReference} — ${entry.entry_name}`,
      actorId,
      sourcePaymentId: data.id,
    })
    if (fundResult.error) return { error: fundResult.error }
  }

  const statusResult = await updateEntryPaymentStatus(
    input.entryId,
    (await getEntryAmountDue(input.entryId, input.eventId, 'legacy')).amountDue ?? 0
  )
  if (statusResult.error) return { error: statusResult.error }

  if (statusResult.paymentStatus) {
    const syncResult = await syncRegistrationPaymentStatus(
      input.entryId,
      statusResult.paymentStatus
    )
    if (syncResult.error) return { error: syncResult.error }
  }

  const { promoteMatchesForEntry } = await import('@/features/matches/promotion')
  await promoteMatchesForEntry(input.eventId, input.entryId, actorId)

  return {
    paymentId: paymentIds[0],
    paymentIds,
    paymentCategories: portions.map((portion) => portion.category),
    collectionBatchId,
  }
}

export async function recordMatchBetPayment(
  actorId: string,
  input: RecordMatchBetPaymentInput,
  cashierSessionId: string
): Promise<{ error?: string; paymentId?: string }> {
  const supabase = await createClient()

  const { data: bet, error: betError } = await supabase
    .from('match_bets')
    .select(
      `
        id,
        match_id,
        event_id,
        side,
        amount,
        barcode,
        payment_status,
        matches (
          fight_number,
          status,
          meron_entry_id,
          wala_entry_id
        )
      `
    )
    .eq('id', input.matchBetId)
    .eq('event_id', input.eventId)
    .maybeSingle()

  if (betError) return { error: betError.message }
  if (!bet) return { error: 'Match bet not found' }
  if (bet.payment_status === 'paid') {
    return { error: 'Pledge for this side is already paid' }
  }
  if ((bet.matches as { status?: string } | null)?.status === 'cancelled') {
    return { error: 'This match has been cancelled' }
  }

  const amountDue = Number(bet.amount)
  if (input.amountPaid !== amountDue) {
    return { error: `Pledge due is ${amountDue.toFixed(2)} — collect the full bet amount` }
  }

  const matchRow = bet.matches as {
    fight_number: number
    meron_entry_id: string
    wala_entry_id: string
  }
  const entryId =
    bet.side === 'meron' ? matchRow.meron_entry_id : matchRow.wala_entry_id

  const { data: entry, error: entryError } = await supabase
    .from('entries')
    .select('id, entry_number, entry_name')
    .eq('id', entryId)
    .maybeSingle()

  if (entryError) return { error: entryError.message }
  if (!entry) return { error: 'Entry not found for this match side' }

  const references = await listPaymentReferencesForEvent(input.eventId)
  const paymentReference = getNextPaymentReference(input.eventId, references)

  const { data: payment, error: paymentError } = await supabase
    .from('payments')
    .insert({
      payment_reference: paymentReference,
      entry_id: entryId,
      event_id: input.eventId,
      amount_due: amountDue,
      amount_paid: input.amountPaid,
      amount_tendered: input.amountTendered ?? null,
      change_given: input.changeGiven ?? null,
      balance: 0,
      payment_method: input.paymentMethod,
      receipt_number: input.receiptNumber ?? null,
      payment_status: 'paid',
      payment_category: 'match_bet',
      match_bet_id: bet.id,
      match_id: bet.match_id,
      fight_side: bet.side,
      received_by: actorId,
      cashier_session_id: cashierSessionId,
      paid_at: new Date().toISOString(),
      notes: input.notes ?? null,
    })
    .select('id')
    .single()

  if (paymentError || !payment) {
    return { error: paymentError?.message ?? 'Failed to record pledge payment' }
  }

  const { data: updatedBet, error: betUpdateError } = await supabase
    .from('match_bets')
    .update({
      payment_status: 'paid',
      payment_id: payment.id,
      collected_amount: input.amountPaid,
      updated_at: new Date().toISOString(),
    })
    .eq('id', bet.id)
    .select('id')
    .maybeSingle()

  if (betUpdateError) return { error: betUpdateError.message }
  if (!updatedBet) {
    return {
      error:
        'Payment was recorded but pledge status could not be updated. Contact an organizer to reconcile.',
    }
  }

  await writeAuditLog({
    actorId,
    action: 'payment.match_bet.recorded',
    entityType: 'payment',
    entityId: payment.id,
    newValues: {
      payment_reference: paymentReference,
      match_id: bet.match_id,
      fight_number: matchRow.fight_number,
      side: bet.side,
      bet_barcode: bet.barcode,
      amount_paid: input.amountPaid,
      cashier_session_id: cashierSessionId,
    },
  })

  const fundResult = await postRevolvingFundLedgerEntry({
    eventId: input.eventId,
    amount: input.amountPaid,
    entryType: 'collection',
    description: `Pledge ${paymentReference} — Fight #${matchRow.fight_number} ${bet.side}`,
    actorId,
    sourcePaymentId: payment.id,
    cashierSessionId,
  })
  if (fundResult.error) return { error: fundResult.error }

  const { tryPromoteMatchToQueue } = await import('@/features/matches/promotion')
  await tryPromoteMatchToQueue(bet.match_id as string, actorId)

  return { paymentId: payment.id }
}

type MatchBetCashierRow = {
  id: string
  match_id: string
  event_id: string
  side: string
  amount: number | string
  collected_amount: number | string
  barcode: string
  payment_status: string
  payment_id: string | null
  matches: {
    fight_number: number
    status: string
    queue_status: string | null
    meron_entry_id: string
    wala_entry_id: string
    meron_rooster_id: string
    wala_rooster_id: string
  }
}

function assertMatchBetAdjustmentAllowed(
  matchRow: MatchBetCashierRow['matches']
): string | null {
  if (matchRow.status === 'cancelled' || matchRow.status === 'completed') {
    return 'This match is no longer open for pledge adjustments'
  }

  const queueStatus = matchRow.queue_status
  if (queueStatus && BLOCKED_BET_EDIT_QUEUE_STATUSES.includes(queueStatus as never)) {
    const label =
      FIGHT_QUEUE_STATUS_LABELS[queueStatus as keyof typeof FIGHT_QUEUE_STATUS_LABELS] ??
      queueStatus
    return `Cannot adjust pledge after fight #${matchRow.fight_number} is ${label.toLowerCase()}`
  }

  return null
}

export async function recordMatchBetTopUp(
  actorId: string,
  input: RecordMatchBetTopUpInput,
  cashierSessionId: string
): Promise<{ error?: string; paymentId?: string }> {
  const supabase = await createClient()

  const { data: bet, error: betError } = await supabase
    .from('match_bets')
    .select(
      `
        id,
        match_id,
        event_id,
        side,
        amount,
        collected_amount,
        barcode,
        payment_status,
        payment_id,
        matches (
          fight_number,
          status,
          queue_status,
          meron_entry_id,
          wala_entry_id
        )
      `
    )
    .eq('id', input.matchBetId)
    .eq('event_id', input.eventId)
    .maybeSingle()

  if (betError) return { error: betError.message }
  if (!bet) return { error: 'Match bet not found' }

  const matchRow = bet.matches as MatchBetCashierRow['matches']
  const adjustmentBlock = assertMatchBetAdjustmentAllowed(matchRow)
  if (adjustmentBlock) return { error: adjustmentBlock }

  if (bet.payment_status !== 'paid') {
    return { error: 'Collect the initial pledge before recording a top-up' }
  }

  const agreedAmount = Number(bet.amount)
  const collectedAmount = Number(bet.collected_amount)
  const delta = getMatchBetAdjustmentDelta(agreedAmount, collectedAmount)

  if (delta <= 0) {
    return { error: 'No additional pledge is due for this side' }
  }

  if (input.amount !== delta) {
    return {
      error: `Additional pledge due is ${delta.toFixed(2)} — collect the full adjustment amount`,
    }
  }

  const entryId =
    bet.side === 'meron' ? matchRow.meron_entry_id : matchRow.wala_entry_id

  const { data: entry, error: entryError } = await supabase
    .from('entries')
    .select('id, entry_number, entry_name')
    .eq('id', entryId)
    .maybeSingle()

  if (entryError) return { error: entryError.message }
  if (!entry) return { error: 'Entry not found for this match side' }

  const references = await listPaymentReferencesForEvent(input.eventId)
  const paymentReference = getNextPaymentReference(input.eventId, references)

  const { data: payment, error: paymentError } = await supabase
    .from('payments')
    .insert({
      payment_reference: paymentReference,
      entry_id: entryId,
      event_id: input.eventId,
      amount_due: input.amount,
      amount_paid: input.amount,
      amount_tendered: input.amountTendered ?? null,
      change_given: input.changeGiven ?? null,
      balance: 0,
      payment_method: input.paymentMethod,
      payment_status: 'paid',
      payment_category: 'match_bet',
      match_bet_id: bet.id,
      match_id: bet.match_id,
      fight_side: bet.side,
      received_by: actorId,
      cashier_session_id: cashierSessionId,
      paid_at: new Date().toISOString(),
      notes: input.notes ?? null,
    })
    .select('id')
    .single()

  if (paymentError || !payment) {
    return { error: paymentError?.message ?? 'Failed to record pledge top-up' }
  }

  const nextCollected = roundMatchMoney(collectedAmount + input.amount)
  const { data: updatedBet, error: betUpdateError } = await supabase
    .from('match_bets')
    .update({
      collected_amount: nextCollected,
      updated_at: new Date().toISOString(),
    })
    .eq('id', bet.id)
    .select('id')
    .maybeSingle()

  if (betUpdateError) return { error: betUpdateError.message }
  if (!updatedBet) {
    return { error: 'Failed to update pledge collected amount' }
  }

  await writeAuditLog({
    actorId,
    action: 'payment.match_bet.top_up',
    entityType: 'payment',
    entityId: payment.id,
    newValues: {
      payment_reference: paymentReference,
      match_id: bet.match_id,
      fight_number: matchRow.fight_number,
      side: bet.side,
      bet_barcode: bet.barcode,
      amount_paid: input.amount,
      collected_amount: nextCollected,
      cashier_session_id: cashierSessionId,
    },
  })

  const fundResult = await postRevolvingFundLedgerEntry({
    eventId: input.eventId,
    amount: input.amount,
    entryType: 'collection',
    description: `Pledge top-up ${paymentReference} — Fight #${matchRow.fight_number} ${bet.side}`,
    actorId,
    sourcePaymentId: payment.id,
    cashierSessionId,
  })
  if (fundResult.error) return { error: fundResult.error }

  const { tryPromoteMatchToQueue } = await import('@/features/matches/promotion')
  await tryPromoteMatchToQueue(bet.match_id as string, actorId)

  return { paymentId: payment.id }
}

export async function recordMatchBetPartialRefund(
  actorId: string,
  input: RecordMatchBetPartialRefundInput,
  cashierSessionId: string
): Promise<{ error?: string; paymentId?: string }> {
  const supabase = await createClient()

  const { data: bet, error: betError } = await supabase
    .from('match_bets')
    .select(
      `
        id,
        match_id,
        event_id,
        side,
        amount,
        collected_amount,
        barcode,
        payment_status,
        payment_id,
        matches (
          fight_number,
          status,
          queue_status,
          meron_entry_id,
          wala_entry_id
        )
      `
    )
    .eq('id', input.matchBetId)
    .eq('event_id', input.eventId)
    .maybeSingle()

  if (betError) return { error: betError.message }
  if (!bet) return { error: 'Match bet not found' }

  const matchRow = bet.matches as MatchBetCashierRow['matches']
  const adjustmentBlock = assertMatchBetAdjustmentAllowed(matchRow)
  if (adjustmentBlock) return { error: adjustmentBlock }

  if (bet.payment_status !== 'paid') {
    return { error: 'Nothing has been collected for this side yet' }
  }

  const agreedAmount = Number(bet.amount)
  const collectedAmount = Number(bet.collected_amount)
  const delta = getMatchBetAdjustmentDelta(agreedAmount, collectedAmount)

  if (delta >= 0) {
    return { error: 'No pledge refund is due for this side' }
  }

  const refundDue = roundMatchMoney(Math.abs(delta))
  if (input.amount !== refundDue) {
    return {
      error: `Pledge refund due is ${refundDue.toFixed(2)} — refund the full adjustment amount`,
    }
  }

  const { data: payments, error: paymentsError } = await supabase
    .from('payments')
    .select('id, amount_paid, refunded_amount, payment_status, payment_reference')
    .eq('match_bet_id', bet.id)
    .eq('payment_status', 'paid')
    .gt('amount_paid', 0)
    .order('paid_at', { ascending: false })

  if (paymentsError) return { error: paymentsError.message }
  if (!payments?.length) {
    return { error: 'No pledge payment rows found to refund' }
  }

  let remaining = refundDue
  for (const paymentRow of payments) {
    if (remaining <= 0) break

    const available = roundMatchMoney(Number(paymentRow.amount_paid))
    if (available <= 0) continue

    const refundPortion = roundMatchMoney(Math.min(available, remaining))
    const nextPaid = roundMatchMoney(available - refundPortion)
    const nextRefunded = roundMatchMoney(
      Number(paymentRow.refunded_amount ?? 0) + refundPortion
    )

    const { error: paymentUpdateError } = await supabase
      .from('payments')
      .update({
        amount_paid: nextPaid,
        refunded_amount: nextRefunded,
        payment_status: nextPaid <= 0 ? 'refunded' : 'paid',
        balance: nextPaid <= 0 ? Number(bet.amount) : 0,
        ...clearedTenderFieldsForRefund(),
      })
      .eq('id', paymentRow.id)

    if (paymentUpdateError) return { error: paymentUpdateError.message }

    await writeAuditLog({
      actorId,
      action: 'payment.match_bet.partial_refund',
      entityType: 'payment',
      entityId: paymentRow.id as string,
      newValues: {
        refund_amount: refundPortion,
        reason: input.reason,
        match_id: bet.match_id,
        fight_number: matchRow.fight_number,
        side: bet.side,
      },
    })

    const fundResult = await postRevolvingFundLedgerEntry({
      eventId: input.eventId,
      amount: -refundPortion,
      entryType: 'refund',
      description: `Pledge adjustment refund ${paymentRow.payment_reference} — ${input.reason}`,
      actorId,
      sourcePaymentId: paymentRow.id as string,
      cashierSessionId,
    })
    if (fundResult.error) return { error: fundResult.error }

    remaining = roundMatchMoney(remaining - refundPortion)
  }

  if (remaining > 0) {
    return { error: 'Could not refund the full pledge adjustment amount' }
  }

  const nextCollected = roundMatchMoney(collectedAmount - refundDue)
  const { data: updatedBet, error: betUpdateError } = await supabase
    .from('match_bets')
    .update({
      collected_amount: nextCollected,
      updated_at: new Date().toISOString(),
    })
    .eq('id', bet.id)
    .select('id')
    .maybeSingle()

  if (betUpdateError) return { error: betUpdateError.message }
  if (!updatedBet) {
    return { error: 'Failed to update pledge collected amount after refund' }
  }

  if (
    isMatchBetSideSettled(agreedAmount, nextCollected, bet.payment_status as MatchBetPaymentStatus)
  ) {
    const { tryPromoteMatchToQueue } = await import('@/features/matches/promotion')
    await tryPromoteMatchToQueue(bet.match_id as string, actorId)
  }

  return { paymentId: bet.payment_id ?? undefined }
}

export async function getPaymentForEvent(
  eventId: string,
  paymentId: string
): Promise<(PaymentLedgerItem & { sessionOpenedAt: string | null }) | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('payments')
    .select(
      `
      id,
      payment_reference,
      entry_id,
      amount_due,
      amount_paid,
      amount_tendered,
      change_given,
      balance,
      payment_method,
      receipt_number,
      payment_status,
      payment_category,
      paid_at,
      notes,
      created_at,
      updated_at,
      cashier_session_id,
      collection_batch_id,
      refund_batch_id,
      refunded_amount,
      match_id,
      fight_side,
      entries ( entry_number, entry_name, owner_name ),
      match_bets!payments_match_bet_id_fkey ( barcode ),
      matches ( fight_number ),
      cashier_sessions (
        opened_at,
        profiles!cashier_sessions_staff_user_id_fkey ( display_name )
      )
    `
    )
    .eq('event_id', eventId)
    .eq('id', paymentId)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  const mapped = mapPaymentLedgerRow(data as unknown as PaymentLedgerRow)
  return {
    id: mapped.id,
    paymentReference: mapped.paymentReference,
    entryId: mapped.entryId,
    entryNumber: mapped.entryNumber,
    entryName: mapped.entryName,
    ownerName: mapped.ownerName,
    amountDue: mapped.amountDue,
    amountPaid: mapped.amountPaid,
    amountTendered: mapped.amountTendered,
    changeGiven: mapped.changeGiven,
    balance: mapped.balance,
    paymentMethod: mapped.paymentMethod,
    receiptNumber: mapped.receiptNumber,
    paymentStatus: mapped.paymentStatus,
    paymentCategory: mapped.paymentCategory,
    paidAt: mapped.paidAt,
    notes: mapped.notes,
    createdAt: mapped.createdAt,
    updatedAt: mapped.updatedAt,
    cashierSessionId: mapped.cashierSessionId,
    cashierName: mapped.cashierName,
    collectionBatchId: mapped.collectionBatchId,
    refundBatchId: mapped.refundBatchId,
    refundedAmount: mapped.refundedAmount,
    matchId: mapped.matchId,
    fightSide: mapped.fightSide,
    fightNumber: mapped.fightNumber,
    betBarcode: mapped.betBarcode,
    sessionOpenedAt: mapped.sessionOpenedAt,
  }
}

type BatchPaymentRow = PaymentLedgerRow

async function getCategoryPaidExcludingBatch(
  entryId: string,
  category: PaymentCategory,
  batchId: string
): Promise<number> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('payments')
    .select('amount_paid, collection_batch_id')
    .eq('entry_id', entryId)
    .eq('payment_category', category)
    .neq('payment_status', 'refunded')

  if (error) throw error

  return (data ?? [])
    .filter((row) => row.collection_batch_id !== batchId)
    .reduce((sum, row) => sum + Number(row.amount_paid), 0)
}

async function getPriorBatchReceipt(
  entryId: string,
  batchId: string,
  batchPaidAt: string
): Promise<{ reference: string; totalCollected: number } | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('payments')
    .select('payment_reference, collection_batch_id, amount_paid, paid_at')
    .eq('entry_id', entryId)
    .not('collection_batch_id', 'is', null)
    .neq('collection_batch_id', batchId)
    .neq('payment_status', 'refunded')
    .lt('paid_at', batchPaidAt)
    .order('paid_at', { ascending: false })

  if (error) throw error
  if (!data?.length) return null

  const priorBatchId = data[0].collection_batch_id as string
  const priorRows = data.filter((row) => row.collection_batch_id === priorBatchId)
  const totalCollected = roundMoney(
    priorRows.reduce((sum, row) => sum + Number(row.amount_paid), 0)
  )

  return {
    reference: priorRows[0]?.payment_reference as string,
    totalCollected,
  }
}

export async function getPaymentBatchForEvent(
  eventId: string,
  batchId: string
): Promise<PaymentBatchReceiptItem | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('payments')
    .select(
      `
      id,
      payment_reference,
      entry_id,
      amount_due,
      amount_paid,
      amount_tendered,
      change_given,
      balance,
      payment_method,
      receipt_number,
      payment_status,
      payment_category,
      paid_at,
      notes,
      created_at,
      cashier_session_id,
      collection_batch_id,
      match_id,
      fight_side,
      entries ( entry_number, entry_name, owner_name, payment_status ),
      match_bets!payments_match_bet_id_fkey ( barcode ),
      matches ( fight_number ),
      cashier_sessions (
        opened_at,
        profiles!cashier_sessions_staff_user_id_fkey ( display_name )
      )
    `
    )
    .eq('event_id', eventId)
    .eq('collection_batch_id', batchId)
    .order('created_at', { ascending: true })

  if (error) throw error
  if (!data?.length) return null

  const rows = data as unknown as BatchPaymentRow[]
  const firstRow = rows[0]
  const mappedFirst = mapPaymentLedgerRow(firstRow)
  const paidAt = firstRow.paid_at ?? firstRow.created_at

  const categoryOrder = REGISTRATION_DUES_CATEGORIES
  const sortedRows = [...rows].sort(
    (a, b) =>
      categoryOrder.indexOf(a.payment_category) - categoryOrder.indexOf(b.payment_category)
  )

  const duesResult = await getEntryOutstandingDues(eventId, firstRow.entry_id)
  const configuredLines =
    duesResult.dues?.lines.filter((line) =>
      REGISTRATION_DUES_CATEGORIES.includes(line.category)
    ) ?? []

  const lines: PaymentBatchReceiptLine[] = []
  for (const category of categoryOrder) {
    const configured = configuredLines.find((line) => line.category === category)
    if (!configured || configured.amountDue <= 0) continue

    const previouslyPaid = await getCategoryPaidExcludingBatch(
      firstRow.entry_id,
      category,
      batchId
    )
    const batchRow = sortedRows.find((row) => row.payment_category === category)
    const amountCollected = batchRow ? Number(batchRow.amount_paid) : 0

    lines.push(
      buildBatchReceiptLine(category, configured.amountDue, previouslyPaid, amountCollected)
    )
  }

  const priorBatch = await getPriorBatchReceipt(firstRow.entry_id, batchId, paidAt)
  const isFollowUpCollect = lines.some((line) => line.previouslyPaid > 0)

  const totalCollected = roundMoney(
    sortedRows.reduce((sum, row) => sum + Number(row.amount_paid), 0)
  )
  const lastRow = sortedRows[sortedRows.length - 1]
  const changeGiven =
    lastRow.change_given != null ? Number(lastRow.change_given) : null
  const amountTendered =
    changeGiven != null ? roundMoney(totalCollected + changeGiven) : null

  const entryPaymentStatus = deriveEntryPaymentStatus(lines)

  return {
    collectionBatchId: batchId,
    paymentReference: mappedFirst.paymentReference,
    eventName: '',
    entryId: mappedFirst.entryId,
    entryNumber: mappedFirst.entryNumber,
    entryName: mappedFirst.entryName,
    ownerName: mappedFirst.ownerName,
    cashierName: mappedFirst.cashierName,
    sessionOpenedAt: mappedFirst.sessionOpenedAt,
    paymentMethod: mappedFirst.paymentMethod,
    amountTendered,
    changeGiven,
    totalCollected,
    paidAt,
    entryPaymentStatus,
    lines,
    priorReceiptReference: priorBatch?.reference ?? null,
    priorReceiptCollected: priorBatch?.totalCollected ?? null,
    isFollowUpCollect,
  }
}

export async function refundPayment(
  actorId: string,
  input: RefundPaymentInput,
  options?: { refundBatchId?: string }
): Promise<{ error?: string }> {
  const supabase = await createClient()

  const { data: payment, error: fetchError } = await supabase
    .from('payments')
    .select(
      'id, payment_reference, entry_id, event_id, amount_due, amount_paid, payment_status, amount_tendered, change_given, payment_category, match_bet_id, match_id'
    )
    .eq('id', input.paymentId)
    .eq('event_id', input.eventId)
    .maybeSingle()

  if (fetchError) return { error: fetchError.message }
  if (!payment) return { error: 'Payment not found' }
  if (payment.payment_status === 'refunded') {
    return { error: 'Payment is already refunded' }
  }

  const refundAmount = Number(payment.amount_paid)

  if (payment.payment_category === 'match_bet') {
    const matchBetId = payment.match_bet_id as string | null
    const matchId = payment.match_id as string | null
    if (!matchBetId || !matchId) {
      return { error: 'Pledge payment is missing match bet linkage' }
    }

    const { revertPledgePaymentSideEffects } = await import('@/features/matches/promotion')
    const sideEffectResult = await revertPledgePaymentSideEffects(
      matchBetId,
      matchId,
      actorId
    )
    if (sideEffectResult.error) return { error: sideEffectResult.error }
  }

  const { error } = await supabase
    .from('payments')
    .update({
      payment_status: 'refunded',
      balance: Number(payment.amount_due),
      amount_paid: 0,
      refunded_amount: refundAmount > 0 ? refundAmount : null,
      refund_batch_id: options?.refundBatchId ?? null,
      ...clearedTenderFieldsForRefund(),
    })
    .eq('id', input.paymentId)

  if (error) return { error: error.message }

  const statusResult = await updateEntryPaymentStatus(
    payment.entry_id,
    (await getEntryAmountDue(payment.entry_id, input.eventId, 'legacy')).amountDue ?? 0
  )
  if (statusResult.error) return { error: statusResult.error }

  if (statusResult.paymentStatus) {
    const syncResult = await syncRegistrationPaymentStatus(
      payment.entry_id,
      statusResult.paymentStatus
    )
    if (syncResult.error) return { error: syncResult.error }
  }

  await writeAuditLog({
    actorId,
    action: 'payment.refunded',
    entityType: 'payment',
    entityId: input.paymentId,
    oldValues: {
      payment_reference: payment.payment_reference,
      payment_status: payment.payment_status,
      payment_category: payment.payment_category,
      amount_paid: payment.amount_paid,
      amount_tendered: payment.amount_tendered,
      change_given: payment.change_given,
    },
    newValues: {
      payment_status: 'refunded',
      entry_id: payment.entry_id,
      refund_batch_id: options?.refundBatchId ?? null,
      refunded_amount: refundAmount > 0 ? refundAmount : null,
    },
    reason: input.reason,
  })

  if (refundAmount > 0) {
    const fundResult = await postRevolvingFundLedgerEntry({
      eventId: input.eventId,
      amount: -refundAmount,
      entryType: 'refund',
      description: `Refund ${payment.payment_reference} — ${input.reason}`,
      actorId,
      sourcePaymentId: input.paymentId,
    })
    if (fundResult.error) return { error: fundResult.error }
  }

  return {}
}

export async function refundSelectedPayments(
  actorId: string,
  input: RefundSelectedPaymentsInput
): Promise<{ error?: string; refundBatchId?: string }> {
  const supabase = await createClient()
  const uniquePaymentIds = [...new Set(input.paymentIds)]

  const { data: payments, error: fetchError } = await supabase
    .from('payments')
    .select(
      'id, payment_category, payment_status, amount_paid, event_id, entry_id, collection_batch_id'
    )
    .eq('event_id', input.eventId)
    .in('id', uniquePaymentIds)

  if (fetchError) return { error: fetchError.message }
  if (!payments?.length || payments.length !== uniquePaymentIds.length) {
    return { error: 'One or more payments were not found' }
  }

  for (const payment of payments) {
    const category = payment.payment_category as PaymentCategory

    if (category === 'cash_bond') {
      const entryId = payment.entry_id as string
      const bondEligibility = await getEntryCashBondRefundEligibility(
        input.eventId,
        entryId
      )
      if (!bondEligibility.eligible || bondEligibility.paymentId !== payment.id) {
        return {
          error: bondEligibility.reason ?? 'Cash bond cannot be refunded',
        }
      }
      continue
    }

    const eligibility = getPaymentRefundEligibility({
      paymentCategory: category,
      paymentStatus: payment.payment_status as PaymentStatus,
      amountPaid: Number(payment.amount_paid),
    })
    if (!eligibility.refundable) {
      return {
        error: eligibility.reason ?? 'One or more selected items cannot be refunded',
      }
    }
  }

  const refundBatchId = crypto.randomUUID()

  for (const paymentId of uniquePaymentIds) {
    const result = await refundPayment(
      actorId,
      {
        paymentId,
        eventId: input.eventId,
        reason: input.reason,
      },
      { refundBatchId }
    )
    if (result.error) return { error: result.error }
  }

  return { refundBatchId }
}

export async function getRefundBatchForEvent(
  eventId: string,
  refundBatchId: string
): Promise<PaymentRefundBatchReceiptItem | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('payments')
    .select(
      `
      id,
      payment_reference,
      entry_id,
      amount_due,
      amount_paid,
      refunded_amount,
      payment_status,
      payment_category,
      paid_at,
      created_at,
      updated_at,
      collection_batch_id,
      refund_batch_id,
      notes,
      entries ( entry_number, entry_name, owner_name ),
      cashier_sessions (
        profiles!cashier_sessions_staff_user_id_fkey ( display_name )
      )
    `
    )
    .eq('event_id', eventId)
    .eq('refund_batch_id', refundBatchId)
    .order('created_at', { ascending: true })

  if (error) throw error
  if (!data?.length) return null

  const rows = data as unknown as Array<
    PaymentLedgerRow & {
      refunded_amount: number | null
      refund_batch_id: string | null
      updated_at: string
    }
  >
  const firstRow = rows[0]
  const collectionBatchId = firstRow.collection_batch_id
  const categoryOrder = REGISTRATION_DUES_CATEGORIES

  const { data: auditRows, error: auditError } = await supabase
    .from('audit_logs')
    .select('new_values, created_at')
    .eq('action', 'payment.refunded')
    .eq('entity_id', firstRow.id)
    .order('created_at', { ascending: false })
    .limit(1)

  if (auditError) throw auditError
  const auditNewValues = auditRows?.[0]?.new_values as { reason?: string } | null
  const reason = auditNewValues?.reason ?? 'Refund'

  let originalReceiptReference = firstRow.payment_reference
  let collectionRows: BatchPaymentRow[] = []

  if (collectionBatchId) {
    const { data: batchData, error: batchError } = await supabase
      .from('payments')
      .select(
        `
        id,
        payment_reference,
        entry_id,
        amount_due,
        amount_paid,
        refunded_amount,
        payment_status,
        payment_category,
        paid_at,
        created_at,
        collection_batch_id
      `
      )
      .eq('event_id', eventId)
      .eq('collection_batch_id', collectionBatchId)
      .order('created_at', { ascending: true })

    if (batchError) throw batchError
    collectionRows = (batchData ?? []) as unknown as BatchPaymentRow[]
    originalReceiptReference =
      collectionRows[0]?.payment_reference ?? originalReceiptReference
  }

  const duesResult = await getEntryOutstandingDues(eventId, firstRow.entry_id)
  const configuredLines =
    duesResult.dues?.lines.filter((line) =>
      REGISTRATION_DUES_CATEGORIES.includes(line.category)
    ) ?? []

  const refundByCategory = new Map<PaymentCategory, number>()
  for (const row of rows) {
    const category = row.payment_category as PaymentCategory
    const amount = Number(row.refunded_amount ?? 0)
    refundByCategory.set(category, (refundByCategory.get(category) ?? 0) + amount)
  }

  const lines = []
  for (const category of categoryOrder) {
    const configured = configuredLines.find((line) => line.category === category)
    if (!configured || configured.amountDue <= 0) continue

    const collectionRow = collectionRows.find((row) => row.payment_category === category)
    const normalizedCollected = collectionRow
      ? collectionRow.payment_status === 'refunded'
        ? Number(collectionRow.refunded_amount ?? 0)
        : Number(collectionRow.amount_paid)
      : 0
    const amountRefunded = refundByCategory.get(category) ?? 0

    if (normalizedCollected <= 0 && amountRefunded <= 0) continue

    lines.push(
      buildRefundBatchReceiptLine(
        category,
        configured.amountDue,
        normalizedCollected,
        amountRefunded
      )
    )
  }

  const totalRefunded = roundMoney(
    rows.reduce((sum, row) => sum + Number(row.refunded_amount ?? 0), 0)
  )
  const mappedFirst = mapPaymentLedgerRow(firstRow)
  const refundedAt = firstRow.updated_at ?? firstRow.paid_at ?? firstRow.created_at

  return {
    refundBatchId,
    refundReference: firstRow.payment_reference,
    originalReceiptReference,
    collectionBatchId,
    eventName: '',
    entryId: firstRow.entry_id,
    entryNumber: mappedFirst.entryNumber,
    entryName: mappedFirst.entryName,
    ownerName: mappedFirst.ownerName,
    cashierName: mappedFirst.cashierName,
    reason,
    totalRefunded,
    lines,
    refundedAt,
  }
}

type EntryCashierRow = {
  id: string
  entry_number: string
  entry_name: string
  owner_name: string
  owner_barcode: string | null
  payment_status: PaymentStatus
  fee_snapshot: EntryFeeSnapshot | null
}

async function loadEntryCashierRow(
  eventId: string,
  entryId: string
): Promise<{ error?: string; entry?: EntryCashierRow }> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('entries')
    .select(
      'id, entry_number, entry_name, owner_name, owner_barcode, payment_status, fee_snapshot'
    )
    .eq('id', entryId)
    .eq('event_id', eventId)
    .is('deleted_at', null)
    .maybeSingle()

  if (error) return { error: error.message }
  if (!data) return { error: 'Entry not found' }
  return { entry: data as EntryCashierRow }
}

async function countRoostersForEntry(entryId: string): Promise<number> {
  const supabase = await createClient()
  const { count, error } = await supabase
    .from('rooster_event_registrations')
    .select('id', { count: 'exact', head: true })
    .eq('entry_id', entryId)

  if (error) throw error
  return count ?? 0
}

async function getPaidByCategory(
  entryId: string
): Promise<Partial<Record<PaymentCategory, number>>> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('payments')
    .select('payment_category, amount_paid, payment_status')
    .eq('entry_id', entryId)
    .neq('payment_status', 'refunded')

  if (error) throw error

  const paid: Partial<Record<PaymentCategory, number>> = {}
  for (const row of data ?? []) {
    const category = row.payment_category as PaymentCategory
    paid[category] = Number(
      ((paid[category] ?? 0) + Number(row.amount_paid)).toFixed(2)
    )
  }
  return paid
}

async function getAdjustmentCollectOutstanding(
  entryId: string
): Promise<{ collectDue: number; paid: number }> {
  const supabase = await createClient()
  const { data: lines, error } = await supabase
    .from('entry_fee_adjustment_lines')
    .select('delta')
    .eq('entry_id', entryId)

  if (error) throw error

  const collectDue = (lines ?? []).reduce((sum, row) => {
    const delta = Number(row.delta)
    return delta > 0 ? sum + delta : sum
  }, 0)

  const { totalPaid } = await getEntryCategoryPaid(entryId, 'adjustment')
  return {
    collectDue: Number(collectDue.toFixed(2)),
    paid: totalPaid,
  }
}

export async function getEntryCashBondRefundEligibility(
  eventId: string,
  entryId: string
): Promise<CashBondRefundEligibility> {
  const supabase = await createClient()

  const { data: roosters, error: roosterError } = await supabase
    .from('rooster_event_registrations')
    .select('id, registration_status')
    .eq('event_id', eventId)
    .eq('entry_id', entryId)

  if (roosterError) throw roosterError

  const { data: matches, error: matchError } = await supabase
    .from('matches')
    .select(
      'status, meron_entry_id, wala_entry_id, meron_rooster_id, wala_rooster_id'
    )
    .eq('event_id', eventId)
    .or(`meron_entry_id.eq.${entryId},wala_entry_id.eq.${entryId}`)

  if (matchError) throw matchError

  const { data: bondPayments, error: paymentError } = await supabase
    .from('payments')
    .select('id, amount_paid, payment_status, refunded_amount')
    .eq('event_id', eventId)
    .eq('entry_id', entryId)
    .eq('payment_category', 'cash_bond')
    .order('created_at', { ascending: false })

  if (paymentError) throw paymentError

  const activeBond = (bondPayments ?? []).find(
    (row) => row.payment_status !== 'refunded' && Number(row.amount_paid) > 0
  )
  const refundedBond = (bondPayments ?? []).find(
    (row) => row.payment_status === 'refunded'
  )
  const bondRow = activeBond ?? refundedBond ?? bondPayments?.[0] ?? null

  return evaluateCashBondRefundEligibility(
    (roosters ?? []).map((row) => ({
      id: row.id as string,
      registrationStatus: row.registration_status as string,
    })),
    (matches ?? []).map((row) => ({
      status: row.status as string,
      meronEntryId: row.meron_entry_id as string,
      walaEntryId: row.wala_entry_id as string,
      meronRoosterId: row.meron_rooster_id as string,
      walaRoosterId: row.wala_rooster_id as string,
    })),
    bondRow
      ? {
          id: bondRow.id as string,
          amountPaid: Number(bondRow.amount_paid),
          paymentStatus: bondRow.payment_status as string,
        }
      : null
  )
}

function applyCashBondRefundToDues(
  dues: EntryOutstandingDues,
  cashBondRefund: CashBondRefundEligibility
): EntryOutstandingDues {
  const bondLine = dues.lines.find((line) => line.category === 'cash_bond')
  if (!bondLine) {
    return dues
  }

  const bondPaid = bondLine.amountPaid > 0 && bondLine.outstanding <= 0
  if (!bondPaid && cashBondRefund.reason !== 'Already refunded') {
    return { ...dues, lines: dues.lines.map((line) => ({ ...line })) }
  }

  const lines = dues.lines.map((line) => {
    if (line.category !== 'cash_bond') return line

    return {
      ...line,
      displayLabel:
        bondPaid || cashBondRefund.reason === 'Already refunded'
          ? CASH_BOND_PAID_DISPLAY_LABEL
          : line.label,
      refundHint: cashBondRefund.eligible ? undefined : cashBondRefund.reason,
      refundable: cashBondRefund.eligible,
    }
  })

  return { ...dues, lines }
}

export async function getEntryOutstandingDues(
  eventId: string,
  entryId: string
): Promise<{ error?: string; dues?: EntryOutstandingDues }> {
  const supabase = await createClient()

  const entryResult = await loadEntryCashierRow(eventId, entryId)
  if (entryResult.error || !entryResult.entry) {
    return { error: entryResult.error ?? 'Entry not found' }
  }

  const { data: event, error: eventError } = await supabase
    .from('events')
    .select(
      'entry_fee, registration_fee_enabled, registration_fee_amount, rooster_entry_fee_enabled, rooster_entry_fee_amount, cash_bond_enabled, cash_bond_amount'
    )
    .eq('id', eventId)
    .maybeSingle()

  if (eventError) return { error: eventError.message }
  if (!event) return { error: 'Event not found' }

  const settings = resolveEntryFeeSettings(event, entryResult.entry.fee_snapshot)
  const roosterCount = await countRoostersForEntry(entryId)
  const paidByCategory = await getPaidByCategory(entryId)
  const adjustment = await getAdjustmentCollectOutstanding(entryId)

  return {
    dues: computeOutstandingDues(
      settings,
      roosterCount,
      paidByCategory,
      adjustment.collectDue,
      adjustment.paid
    ),
  }
}

export async function listCashierSelectableEntries(
  eventId: string
): Promise<CashierSelectableEntry[]> {
  const supabase = await createClient()

  const { data: event, error: eventError } = await supabase
    .from('events')
    .select(
      'entry_fee, registration_fee_enabled, registration_fee_amount, rooster_entry_fee_enabled, rooster_entry_fee_amount, cash_bond_enabled, cash_bond_amount'
    )
    .eq('id', eventId)
    .maybeSingle()

  if (eventError) throw eventError
  if (!event) return []

  const { data: entries, error: entriesError } = await supabase
    .from('entries')
    .select('id, entry_number, entry_name, owner_name, fee_snapshot')
    .eq('event_id', eventId)
    .is('deleted_at', null)
    .order('entry_number', { ascending: true })

  if (entriesError) throw entriesError
  if (!entries?.length) return []

  const entryIds = entries.map((entry) => entry.id as string)

  const [roostersResult, paymentsResult, adjustmentResult] = await Promise.all([
    supabase.from('rooster_event_registrations').select('entry_id').in('entry_id', entryIds),
    supabase
      .from('payments')
      .select('entry_id, payment_category, amount_paid, payment_status')
      .eq('event_id', eventId)
      .neq('payment_status', 'refunded'),
    supabase.from('entry_fee_adjustment_lines').select('entry_id, delta').in('entry_id', entryIds),
  ])

  if (roostersResult.error) throw roostersResult.error
  if (paymentsResult.error) throw paymentsResult.error
  if (adjustmentResult.error) throw adjustmentResult.error

  const roosterCounts = aggregateRoosterCounts(
    (roostersResult.data ?? []) as Array<{ entry_id: string }>
  )
  const paidByEntry = aggregatePaidByCategoryForEntries(
    (paymentsResult.data ?? []) as Array<{
      entry_id: string
      payment_category: string
      amount_paid: number
    }>
  )
  const adjustmentDueByEntry = aggregateAdjustmentCollectDue(
    (adjustmentResult.data ?? []) as Array<{ entry_id: string; delta: number }>
  )

  const selectable: CashierSelectableEntry[] = []

  for (const entry of entries) {
    const entryId = entry.id as string
    const paidByCategory = paidByEntry.get(entryId) ?? {}
    const item = buildCashierSelectableEntry(event, {
      id: entryId,
      entryNumber: entry.entry_number as string,
      entryName: entry.entry_name as string,
      ownerName: entry.owner_name as string,
      feeSnapshot: entry.fee_snapshot as EntryFeeSnapshot | null,
      roosterCount: roosterCounts.get(entryId) ?? 0,
      paidByCategory,
      adjustmentCollectDue: adjustmentDueByEntry.get(entryId) ?? 0,
      adjustmentPaid: paidByCategory.adjustment ?? 0,
    })

    if (item) {
      selectable.push(item)
    }
  }

  return selectable
}

async function buildCashierMatch(
  eventId: string,
  entry: EntryCashierRow,
  matchedVia: CashierTargetMatch['matchedVia']
): Promise<CashierTargetMatch> {
  const [duesResult, cashBondRefund] = await Promise.all([
    getEntryOutstandingDues(eventId, entry.id),
    getEntryCashBondRefundEligibility(eventId, entry.id),
  ])

  if (duesResult.error || !duesResult.dues) {
    throw new Error(duesResult.error ?? 'Failed to compute dues')
  }

  const roosterCount = await countRoostersForEntry(entry.id)

  return {
    entryId: entry.id,
    entryNumber: entry.entry_number,
    entryName: entry.entry_name,
    ownerName: entry.owner_name,
    ownerBarcode: entry.owner_barcode,
    roosterCount,
    paymentStatus: entry.payment_status,
    dues: applyCashBondRefundToDues(duesResult.dues, cashBondRefund),
    cashBondRefund,
    matchedVia,
  }
}

export async function getCashierTargetByEntryId(
  eventId: string,
  entryId: string
): Promise<{ error?: string; match?: CashierTargetMatch }> {
  const entryResult = await loadEntryCashierRow(eventId, entryId)
  if (entryResult.error || !entryResult.entry) {
    return { error: entryResult.error ?? 'Entry not found' }
  }

  try {
    return {
      match: await buildCashierMatch(eventId, entryResult.entry, 'search'),
    }
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Failed to load cashier target',
    }
  }
}

export async function resolveMatchBetCashierTarget(
  eventId: string,
  barcode: string
): Promise<{ error?: string; matchBet?: MatchBetCashierTarget }> {
  const supabase = await createClient()

  const { data: bet, error: betError } = await supabase
    .from('match_bets')
    .select(
      `
        id,
        match_id,
        event_id,
        side,
        amount,
        collected_amount,
        barcode,
        payment_status,
        payment_id,
        matches (
          fight_number,
          status,
          queue_status,
          meron_entry_id,
          wala_entry_id,
          meron_rooster_id,
          wala_rooster_id
        )
      `
    )
    .eq('event_id', eventId)
    .or(
      `barcode.eq.${barcode.toUpperCase()},scan_code.eq.${barcode.toUpperCase()}`
    )
    .maybeSingle()

  if (betError) return { error: betError.message }
  if (!bet) return { error: `No pledge slip found for barcode ${barcode}` }

  return buildMatchBetCashierTarget(eventId, bet as MatchBetWithMatchJoin)
}

type MatchBetWithMatchJoin = {
  id: string
  match_id: string
  side: string
  amount: number | string
  collected_amount: number | string
  barcode: string
  payment_status: string
  payment_id: string | null
  matches: {
    fight_number: number
    status: string
    queue_status: string | null
    meron_entry_id: string
    wala_entry_id: string
    meron_rooster_id: string
    wala_rooster_id: string
  }
}

async function buildMatchBetCashierTarget(
  eventId: string,
  bet: MatchBetWithMatchJoin
): Promise<{ error?: string; matchBet?: MatchBetCashierTarget }> {
  const supabase = await createClient()
  const matchRow = bet.matches

  if (matchRow.status === 'cancelled') {
    return { error: 'This match has been cancelled' }
  }

  const entryId =
    bet.side === 'meron' ? matchRow.meron_entry_id : matchRow.wala_entry_id
  const roosterId =
    bet.side === 'meron' ? matchRow.meron_rooster_id : matchRow.wala_rooster_id

  const entryResult = await loadEntryCashierRow(eventId, entryId)
  if (entryResult.error || !entryResult.entry) {
    return { error: entryResult.error ?? 'Entry not found for this match side' }
  }

  const { data: rooster, error: roosterError } = await supabase
    .from('rooster_event_registrations')
    .select('cock_number, band_number')
    .eq('id', roosterId)
    .maybeSingle()

  if (roosterError) return { error: roosterError.message }

  const duesResult = await getEntryOutstandingDues(eventId, entryId)
  if (duesResult.error || !duesResult.dues) {
    return { error: duesResult.error ?? 'Failed to compute entry dues' }
  }

  const betAmount = Number(bet.amount)
  const collectedAmount = Number(bet.collected_amount ?? 0)
  const adjustmentDelta = getMatchBetAdjustmentDelta(betAmount, collectedAmount)

  return {
    matchBet: {
      matchBetId: bet.id,
      matchId: bet.match_id,
      eventId,
      fightNumber: Number(matchRow.fight_number),
      side: bet.side as 'meron' | 'wala',
      betBarcode: bet.barcode,
      betAmount,
      collectedAmount,
      adjustmentDelta,
      betPaymentStatus: bet.payment_status as MatchBetPaymentStatus,
      primaryPaymentId: bet.payment_id,
      entryId,
      entryNumber: entryResult.entry.entry_number,
      entryName: entryResult.entry.entry_name,
      ownerName: entryResult.entry.owner_name,
      cockNumber: Number(rooster?.cock_number ?? 0),
      bandNumber: rooster?.band_number ?? '—',
      entryDues: duesResult.dues,
    },
  }
}

export async function resolveMatchBetByRoosterRegistrationId(
  eventId: string,
  registrationId: string
): Promise<{ error?: string; matchBet?: MatchBetCashierTarget }> {
  const supabase = await createClient()

  const { data: match, error: matchError } = await supabase
    .from('matches')
    .select(
      'id, fight_number, status, meron_entry_id, wala_entry_id, meron_rooster_id, wala_rooster_id'
    )
    .eq('event_id', eventId)
    .eq('status', 'draft')
    .is('queue_status', null)
    .or(`meron_rooster_id.eq.${registrationId},wala_rooster_id.eq.${registrationId}`)
    .order('fight_number', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (matchError) return { error: matchError.message }
  if (!match) return {}

  const side =
    match.meron_rooster_id === registrationId
      ? ('meron' as const)
      : ('wala' as const)

  const { data: bet, error: betError } = await supabase
    .from('match_bets')
    .select('id, match_id, side, amount, collected_amount, barcode, payment_status, payment_id')
    .eq('match_id', match.id)
    .eq('side', side)
    .eq('payment_status', 'unpaid')
    .maybeSingle()

  if (betError) return { error: betError.message }
  if (!bet) return {}

  return buildMatchBetCashierTarget(eventId, {
    ...bet,
    matches: {
      fight_number: match.fight_number,
      status: match.status,
      queue_status: null,
      meron_entry_id: match.meron_entry_id,
      wala_entry_id: match.wala_entry_id,
      meron_rooster_id: match.meron_rooster_id,
      wala_rooster_id: match.wala_rooster_id,
    },
  })
}

export async function resolveCashierTarget(
  eventId: string,
  rawQuery: string
): Promise<CashierLookupResult> {
  const trimmed = rawQuery.trim()
  if (!trimmed) {
    return { error: 'Enter a barcode or search for an owner / entry' }
  }

  const classified = classifyCashierQuery(trimmed, eventId)
  const supabase = await createClient()

  if (classified.kind === 'match_bet') {
    const betResult = await resolveMatchBetCashierTarget(eventId, classified.value)
    if (betResult.error) return { error: betResult.error }
    return { matchBet: betResult.matchBet }
  }

  if (classified.kind === 'owner_barcode') {
    const { data, error } = await supabase
      .from('entries')
      .select(
        'id, entry_number, entry_name, owner_name, owner_barcode, payment_status, fee_snapshot'
      )
      .eq('event_id', eventId)
      .or(
        `owner_barcode.eq.${classified.value},owner_scan_code.eq.${classified.value}`
      )
      .is('deleted_at', null)
      .maybeSingle()

    if (error) return { error: error.message }
    if (!data) return { error: `No owner found for barcode ${classified.value}` }

    return {
      matches: [
        await buildCashierMatch(eventId, data as EntryCashierRow, 'owner_barcode'),
      ],
    }
  }

  if (classified.kind === 'cock_barcode') {
    const { data: registration, error: regError } = await supabase
      .from('rooster_event_registrations')
      .select('id, entry_id')
      .eq('event_id', eventId)
      .or(
        `cock_entry_barcode.eq.${classified.value},cock_scan_code.eq.${classified.value}`
      )
      .maybeSingle()

    if (regError) return { error: regError.message }
    if (!registration) {
      return { error: `No rooster found for barcode ${classified.value}` }
    }

    const unpaidPledge = await resolveMatchBetByRoosterRegistrationId(
      eventId,
      registration.id
    )
    if (unpaidPledge.error) return { error: unpaidPledge.error }
    if (unpaidPledge.matchBet) {
      return { matchBet: unpaidPledge.matchBet }
    }

    const entryResult = await loadEntryCashierRow(eventId, registration.entry_id)
    if (entryResult.error || !entryResult.entry) {
      return { error: entryResult.error ?? 'Entry not found for rooster barcode' }
    }

    return {
      matches: [
        await buildCashierMatch(eventId, entryResult.entry, 'cock_barcode'),
      ],
    }
  }

  if (
    trimmed.toUpperCase().startsWith('OWN-') ||
    trimmed.toUpperCase().startsWith('COCK-') ||
    trimmed.toUpperCase().startsWith('BET-')
  ) {
    return { error: 'This barcode does not belong to this event' }
  }

  const safe = trimmed.replace(/[%_,."'\\]/g, ' ').replace(/\s+/g, ' ').trim()
  if (!safe) {
    return { error: 'Enter a barcode or search for an owner / entry' }
  }

  const pattern = `%${safe}%`
  const { data, error } = await supabase
    .from('entries')
    .select(
      'id, entry_number, entry_name, owner_name, owner_barcode, payment_status, fee_snapshot'
    )
    .eq('event_id', eventId)
    .is('deleted_at', null)
    .or(
      `owner_name.ilike."${pattern}",entry_name.ilike."${pattern}",entry_number.ilike."${pattern}"`
    )
    .order('entry_number', { ascending: true })
    .limit(10)

  if (error) return { error: error.message }

  const rows = (data ?? []) as EntryCashierRow[]
  if (rows.length === 0) {
    return { error: `No owners or entries match “${trimmed}”` }
  }

  const matches: CashierTargetMatch[] = []
  for (const row of rows) {
    matches.push(await buildCashierMatch(eventId, row, 'search'))
  }

  return { matches }
}
