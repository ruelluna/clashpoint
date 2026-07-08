import 'server-only'

import { createClient } from '@/lib/supabase/server'

export type AuditLogFilters = {
  entityType?: string
  action?: string
  limit?: number
  offset?: number
}

export async function listAuditLogs(filters: AuditLogFilters = {}) {
  const supabase = await createClient()
  let query = supabase
    .from('audit_logs')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })

  if (filters.entityType) {
    query = query.eq('entity_type', filters.entityType)
  }
  if (filters.action) {
    query = query.ilike('action', `%${filters.action}%`)
  }

  const limit = filters.limit ?? 50
  const offset = filters.offset ?? 0
  query = query.range(offset, offset + limit - 1)

  const { data, error, count } = await query
  if (error) throw error
  return { logs: data ?? [], count: count ?? 0 }
}
