import 'server-only'

import type {
  AdminHandoverCandidate,
  CashierSessionMovement,
  CashierSessionSummary,
} from '@/features/cashier-sessions/types'
import { createClient } from '@/lib/supabase/server'

type SessionRow = {
  id: string
  event_id: string
  staff_user_id: string
  opening_float_amount: number
  opening_float_default: number
  opening_float_note: string | null
  status: CashierSessionSummary['status']
  opened_at: string
  closed_at: string | null
  closing_counted_cash: number | null
  closing_notes: string | null
  profiles: { display_name: string | null } | null
}

type MovementRow = {
  id: string
  cashier_session_id: string
  event_id: string
  movement_type: CashierSessionMovement['movementType']
  amount: number
  description: string
  admin_user_id: string | null
  recorded_by: string
  created_at: string
  admin_profile: { display_name: string | null } | null
  recorder_profile: { display_name: string | null } | null
}

function mapSession(row: SessionRow): CashierSessionSummary {
  return {
    id: row.id,
    eventId: row.event_id,
    staffUserId: row.staff_user_id,
    staffDisplayName: row.profiles?.display_name ?? 'Staff',
    openingFloatAmount: Number(row.opening_float_amount),
    openingFloatDefault: Number(row.opening_float_default),
    openingFloatNote: row.opening_float_note,
    status: row.status,
    openedAt: row.opened_at,
    closedAt: row.closed_at,
    closingCountedCash:
      row.closing_counted_cash != null ? Number(row.closing_counted_cash) : null,
    closingNotes: row.closing_notes,
  }
}

function mapMovement(row: MovementRow): CashierSessionMovement {
  return {
    id: row.id,
    cashierSessionId: row.cashier_session_id,
    eventId: row.event_id,
    movementType: row.movement_type,
    amount: Number(row.amount),
    description: row.description,
    adminUserId: row.admin_user_id,
    adminDisplayName: row.admin_profile?.display_name ?? null,
    recordedBy: row.recorded_by,
    recordedByDisplayName: row.recorder_profile?.display_name ?? null,
    createdAt: row.created_at,
  }
}

export async function getOpenCashierSessionForStaff(
  eventId: string,
  staffUserId: string
): Promise<CashierSessionSummary | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('cashier_sessions')
    .select(
      `
      id,
      event_id,
      staff_user_id,
      opening_float_amount,
      opening_float_default,
      opening_float_note,
      status,
      opened_at,
      closed_at,
      closing_counted_cash,
      closing_notes,
      profiles!cashier_sessions_staff_user_id_fkey ( display_name )
    `
    )
    .eq('event_id', eventId)
    .eq('staff_user_id', staffUserId)
    .eq('status', 'open')
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  return mapSession(data as unknown as SessionRow)
}

export async function getCashierSessionById(
  sessionId: string
): Promise<CashierSessionSummary | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('cashier_sessions')
    .select(
      `
      id,
      event_id,
      staff_user_id,
      opening_float_amount,
      opening_float_default,
      opening_float_note,
      status,
      opened_at,
      closed_at,
      closing_counted_cash,
      closing_notes,
      profiles!cashier_sessions_staff_user_id_fkey ( display_name )
    `
    )
    .eq('id', sessionId)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  return mapSession(data as unknown as SessionRow)
}

export async function listCashierSessionMovements(
  sessionId: string
): Promise<CashierSessionMovement[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('cashier_session_movements')
    .select(
      `
      id,
      cashier_session_id,
      event_id,
      movement_type,
      amount,
      description,
      admin_user_id,
      recorded_by,
      created_at,
      admin_profile:profiles!cashier_session_movements_admin_user_id_fkey ( display_name ),
      recorder_profile:profiles!cashier_session_movements_recorded_by_fkey ( display_name )
    `
    )
    .eq('cashier_session_id', sessionId)
    .order('created_at', { ascending: true })

  if (error) throw error

  return ((data ?? []) as unknown as MovementRow[]).map(mapMovement)
}

export async function listCashierSessionsByEvent(
  eventId: string
): Promise<CashierSessionSummary[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('cashier_sessions')
    .select(
      `
      id,
      event_id,
      staff_user_id,
      opening_float_amount,
      opening_float_default,
      opening_float_note,
      status,
      opened_at,
      closed_at,
      closing_counted_cash,
      closing_notes,
      profiles!cashier_sessions_staff_user_id_fkey ( display_name )
    `
    )
    .eq('event_id', eventId)
    .order('opened_at', { ascending: false })

  if (error) throw error

  return ((data ?? []) as unknown as SessionRow[]).map(mapSession)
}

export async function listAdminHandoverCandidates(): Promise<AdminHandoverCandidate[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('id, display_name, role')
    .in('role', ['admin', 'system_owner'])
    .eq('is_active', true)
    .order('display_name', { ascending: true })

  if (error) throw error

  return (data ?? []).map((row) => ({
    id: row.id as string,
    displayName: (row.display_name as string | null) ?? 'Admin',
    role: row.role as string,
  }))
}

export async function listCashierSessionMovementsByEvent(
  eventId: string
): Promise<CashierSessionMovement[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('cashier_session_movements')
    .select(
      `
      id,
      cashier_session_id,
      event_id,
      movement_type,
      amount,
      description,
      admin_user_id,
      recorded_by,
      created_at,
      admin_profile:profiles!cashier_session_movements_admin_user_id_fkey ( display_name ),
      recorder_profile:profiles!cashier_session_movements_recorded_by_fkey ( display_name )
    `
    )
    .eq('event_id', eventId)
    .order('created_at', { ascending: false })

  if (error) throw error

  return ((data ?? []) as unknown as MovementRow[]).map(mapMovement)
}
