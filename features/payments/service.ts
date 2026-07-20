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
  getEntryFeesOutstanding,
  splitEntryFeesPayment,
  type EntryOutstandingDues,
} from '@/features/payments/dues'
import {
  calculateBalance,
  getNextPaymentReference,
  type RecordMatchBetPaymentInput,
  type RecordPaymentInput,
  type RefundPaymentInput,
} from '@/features/payments/schema'
import { allocateSplitPaymentTender } from '@/features/payments/tender'
import type { PaymentStatus } from '@/features/entries/types'
import type { MatchBetPaymentStatus } from '@/features/matches/types'
import type {
  CashierLookupResult,
  CashierTargetMatch,
  MatchBetCashierTarget,
  PaymentLedgerItem,
} from '@/features/payments/types'
import { postRevolvingFundLedgerEntry } from '@/features/revolving-fund/service'
import { createClient } from '@/lib/supabase/server'

export { calculateBalance } from '@/features/payments/schema'
export type { EntryOutstandingDues } from '@/features/payments/dues'

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
  cashier_session_id: string | null
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
<<<<<<< HEAD
<<<<<<< HEAD
    amountTendered: row.amount_tendered != null ? Number(row.amount_tendered) : null,
    changeGiven: row.change_given != null ? Number(row.change_given) : null,
=======
<<<<<<< Updated upstream
=======
    amountTendered: null,
    changeGiven: null,
>>>>>>> Stashed changes
>>>>>>> cashier-payment-category-updated
=======
    amountTendered: row.amount_tendered != null ? Number(row.amount_tendered) : null,
    changeGiven: row.change_given != null ? Number(row.change_given) : null,
>>>>>>> main
    balance: Number(row.balance),
    paymentMethod: row.payment_method,
    receiptNumber: row.receipt_number,
    paymentStatus: row.payment_status,
    paymentCategory: row.payment_category,
    paidAt: row.paid_at,
    notes: row.notes,
    createdAt: row.created_at,
    cashierSessionId: row.cashier_session_id,
    cashierName: row.cashier_sessions?.profiles?.display_name ?? null,
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
      cashier_session_id,
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
      cashierSessionId: mapped.cashierSessionId,
      cashierName: mapped.cashierName,
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

  const { error } = await supabase
    .from('entries')
    .update({ payment_status: paymentStatus })
    .eq('id', entryId)

  if (error) return { error: error.message }

  return { paymentStatus }
}

async function syncRegistrationPaymentStatus(
  entryId: string,
  paymentStatus: PaymentStatus
): Promise<void> {
  const supabase = await createClient()
  const regPaymentStatus =
    paymentStatus === 'paid'
      ? 'paid'
      : paymentStatus === 'partial'
        ? 'partial'
        : paymentStatus === 'refunded'
          ? 'refunded'
          : 'unpaid'

  await supabase
    .from('rooster_event_registrations')
    .update({ reg_payment_status: regPaymentStatus })
    .eq('entry_id', entryId)

  if (regPaymentStatus === 'paid') {
    await promoteInspectionClearedAfterPayment(entryId)
  }
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
): Promise<{ error?: string; paymentId?: string; paymentIds?: string[]; paymentCategories?: PaymentCategory[] }> {
  if (input.collectEntryFees) {
    return recordSplitEntryFeesPayment(actorId, input, cashierSessionId)
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
    await syncRegistrationPaymentStatus(input.entryId, statusResult.paymentStatus)
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

async function recordSplitEntryFeesPayment(
  actorId: string,
  input: RecordPaymentInput,
  cashierSessionId: string
): Promise<{ error?: string; paymentId?: string; paymentIds?: string[]; paymentCategories?: PaymentCategory[] }> {
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

  const combinedOutstanding = getEntryFeesOutstanding(duesResult.dues.lines)
  if (combinedOutstanding <= 0) {
    return { error: 'No registration or entry fees are outstanding' }
  }
  if (input.amountPaid > combinedOutstanding) {
    return { error: 'Payment exceeds the amount due for entry fees' }
  }

  const split = splitEntryFeesPayment(input.amountPaid, duesResult.dues.lines)
  const portions: Array<{ category: 'registration' | 'rooster_entry'; amount: number }> = []
  if (split.registration > 0) {
    portions.push({ category: 'registration', amount: split.registration })
  }
  if (split.rooster_entry > 0) {
    portions.push({ category: 'rooster_entry', amount: split.rooster_entry })
  }
  if (portions.length === 0) {
    return { error: 'No entry fee amount to collect' }
  }

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
    await syncRegistrationPaymentStatus(input.entryId, statusResult.paymentStatus)
  }

  const { promoteMatchesForEntry } = await import('@/features/matches/promotion')
  await promoteMatchesForEntry(input.eventId, input.entryId, actorId)

  return {
    paymentId: paymentIds[0],
    paymentIds,
    paymentCategories: portions.map((portion) => portion.category),
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
    return { error: 'Palitada for this side is already paid' }
  }
  if ((bet.matches as { status?: string } | null)?.status === 'cancelled') {
    return { error: 'This match has been cancelled' }
  }

  const amountDue = Number(bet.amount)
  if (input.amountPaid !== amountDue) {
    return { error: `Palitada due is ${amountDue.toFixed(2)} — collect the full bet amount` }
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
    return { error: paymentError?.message ?? 'Failed to record palitada payment' }
  }

  const { error: betUpdateError } = await supabase
    .from('match_bets')
    .update({
      payment_status: 'paid',
      payment_id: payment.id,
      updated_at: new Date().toISOString(),
    })
    .eq('id', bet.id)

  if (betUpdateError) return { error: betUpdateError.message }

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
    description: `Palitada ${paymentReference} — Fight #${matchRow.fight_number} ${bet.side}`,
    actorId,
    sourcePaymentId: payment.id,
    cashierSessionId,
  })
  if (fundResult.error) return { error: fundResult.error }

  const { tryPromoteMatchToQueue } = await import('@/features/matches/promotion')
  await tryPromoteMatchToQueue(bet.match_id as string, actorId)

  return { paymentId: payment.id }
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
      cashier_session_id,
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
    cashierSessionId: mapped.cashierSessionId,
    cashierName: mapped.cashierName,
    matchId: mapped.matchId,
    fightSide: mapped.fightSide,
    fightNumber: mapped.fightNumber,
    betBarcode: mapped.betBarcode,
    sessionOpenedAt: mapped.sessionOpenedAt,
  }
}

export async function refundPayment(
  actorId: string,
  input: RefundPaymentInput
): Promise<{ error?: string }> {
  const supabase = await createClient()

  const { data: payment, error: fetchError } = await supabase
    .from('payments')
    .select(
      'id, payment_reference, entry_id, event_id, amount_due, amount_paid, payment_status'
    )
    .eq('id', input.paymentId)
    .eq('event_id', input.eventId)
    .maybeSingle()

  if (fetchError) return { error: fetchError.message }
  if (!payment) return { error: 'Payment not found' }
  if (payment.payment_status === 'refunded') {
    return { error: 'Payment is already refunded' }
  }

  const { error } = await supabase
    .from('payments')
    .update({
      payment_status: 'refunded',
      balance: Number(payment.amount_due),
      amount_paid: 0,
    })
    .eq('id', input.paymentId)

  if (error) return { error: error.message }

  const statusResult = await updateEntryPaymentStatus(
    payment.entry_id,
    (await getEntryAmountDue(payment.entry_id, input.eventId, 'legacy')).amountDue ?? 0
  )
  if (statusResult.error) return { error: statusResult.error }

  if (statusResult.paymentStatus) {
    await syncRegistrationPaymentStatus(payment.entry_id, statusResult.paymentStatus)
  }

  await writeAuditLog({
    actorId,
    action: 'payment.refunded',
    entityType: 'payment',
    entityId: input.paymentId,
    oldValues: {
      payment_reference: payment.payment_reference,
      payment_status: payment.payment_status,
      amount_paid: payment.amount_paid,
    },
    newValues: {
      payment_status: 'refunded',
      entry_id: payment.entry_id,
    },
    reason: input.reason,
  })

  const refundAmount = Number(payment.amount_paid)
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

async function buildCashierMatch(
  eventId: string,
  entry: EntryCashierRow,
  matchedVia: CashierTargetMatch['matchedVia']
): Promise<CashierTargetMatch> {
  const duesResult = await getEntryOutstandingDues(eventId, entry.id)
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
    dues: duesResult.dues,
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
        barcode,
        payment_status,
        matches (
          fight_number,
          status,
          meron_entry_id,
          wala_entry_id,
          meron_rooster_id,
          wala_rooster_id
        )
      `
    )
    .eq('event_id', eventId)
    .eq('barcode', barcode.toUpperCase())
    .maybeSingle()

  if (betError) return { error: betError.message }
  if (!bet) return { error: `No palitada slip found for barcode ${barcode}` }

  const matchRow = bet.matches as {
    fight_number: number
    status: string
    meron_entry_id: string
    wala_entry_id: string
    meron_rooster_id: string
    wala_rooster_id: string
  }

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

  return {
    matchBet: {
      matchBetId: bet.id as string,
      matchId: bet.match_id as string,
      eventId,
      fightNumber: Number(matchRow.fight_number),
      side: bet.side as 'meron' | 'wala',
      betBarcode: bet.barcode as string,
      betAmount: Number(bet.amount),
      betPaymentStatus: bet.payment_status as MatchBetPaymentStatus,
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
      .eq('owner_barcode', classified.value)
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
      .select('entry_id')
      .eq('event_id', eventId)
      .eq('cock_entry_barcode', classified.value)
      .maybeSingle()

    if (regError) return { error: regError.message }
    if (!registration) {
      return { error: `No rooster found for barcode ${classified.value}` }
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
