import type { PromoterStatus, PromoterStatusHistoryItem } from '@/features/promoters/types'

type AuditLogRow = {
  id: string
  action: string
  old_values: unknown
  new_values: unknown
  created_at: string
}

function readStatus(value: unknown): PromoterStatus | null {
  if (value === 'active' || value === 'inactive' || value === 'suspended') {
    return value
  }
  return null
}

function readRecord(value: unknown): Record<string, unknown> | null {
  if (value != null && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }
  return null
}

export function mapAuditLogToStatusHistoryItem(
  row: AuditLogRow
): PromoterStatusHistoryItem | null {
  const oldValues = readRecord(row.old_values)
  const newValues = readRecord(row.new_values)

  if (row.action === 'promoter.status_changed') {
    const fromStatus = readStatus(oldValues?.status)
    const toStatus = readStatus(newValues?.status)
    if (!toStatus) return null

    return {
      id: row.id,
      createdAt: row.created_at,
      fromStatus,
      toStatus,
      reason:
        typeof newValues?.reason === 'string' ? newValues.reason : undefined,
      action: row.action,
    }
  }

  if (row.action === 'promoter.updated') {
    const fromStatus = readStatus(oldValues?.status)
    const toStatus = readStatus(newValues?.status)
    if (!fromStatus || !toStatus || fromStatus === toStatus) return null

    return {
      id: row.id,
      createdAt: row.created_at,
      fromStatus,
      toStatus,
      reason:
        typeof newValues?.reason === 'string' ? newValues.reason : undefined,
      action: row.action,
    }
  }

  return null
}
