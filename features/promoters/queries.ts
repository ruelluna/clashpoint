import 'server-only'

import type {
  Promoter,
  PromoterEventHistoryItem,
  PromoterListItem,
  PromoterStatus,
  PromoterStatusHistoryItem,
} from '@/features/promoters/types'
import { mapAuditLogToStatusHistoryItem } from '@/features/promoters/status-history'
import { createClient } from '@/lib/supabase/server'

export async function listPromoters(
  status?: PromoterStatus
): Promise<PromoterListItem[]> {
  const supabase = await createClient()
  let query = supabase
    .from('promoters')
    .select(
      'id, name, contact_person, email, phone, status, commission_type, commission_value, user_id, created_at'
    )
    .is('deleted_at', null)
    .order('name', { ascending: true })

  if (status) {
    query = query.eq('status', status)
  }

  const { data, error } = await query

  if (error) throw error
  return (data ?? []) as PromoterListItem[]
}

export async function getPromoter(id: string): Promise<Promoter | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('promoters')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .maybeSingle()

  if (error) throw error
  return (data as Promoter | null) ?? null
}

export async function getPromoterEventHistory(
  promoterId: string
): Promise<PromoterEventHistoryItem[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('events')
    .select('id, name, venue, event_date, status, event_type')
    .eq('promoter_id', promoterId)
    .is('deleted_at', null)
    .order('event_date', { ascending: false })

  if (error) throw error
  return (data ?? []) as PromoterEventHistoryItem[]
}

export async function listPromoterStatusHistory(
  promoterId: string,
  limit = 20
): Promise<PromoterStatusHistoryItem[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('audit_logs')
    .select('id, action, old_values, new_values, created_at')
    .eq('entity_type', 'promoter')
    .eq('entity_id', promoterId)
    .in('action', ['promoter.status_changed', 'promoter.updated'])
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error

  return (data ?? [])
    .map((row) =>
      mapAuditLogToStatusHistoryItem({
        id: row.id as string,
        action: row.action as string,
        old_values: row.old_values,
        new_values: row.new_values,
        created_at: row.created_at as string,
      })
    )
    .filter((item): item is PromoterStatusHistoryItem => item != null)
}
