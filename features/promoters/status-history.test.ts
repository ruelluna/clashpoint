import { describe, expect, it } from 'vitest'

import { mapAuditLogToStatusHistoryItem } from '@/features/promoters/status-history'

describe('mapAuditLogToStatusHistoryItem', () => {
  it('maps promoter.status_changed with reason', () => {
    const item = mapAuditLogToStatusHistoryItem({
      id: 'log-1',
      action: 'promoter.status_changed',
      old_values: { status: 'active' },
      new_values: { status: 'suspended', reason: 'Policy violation' },
      created_at: '2026-07-19T10:00:00.000Z',
    })

    expect(item).toEqual({
      id: 'log-1',
      createdAt: '2026-07-19T10:00:00.000Z',
      fromStatus: 'active',
      toStatus: 'suspended',
      reason: 'Policy violation',
      action: 'promoter.status_changed',
    })
  })

  it('maps promoter.updated when status changed', () => {
    const item = mapAuditLogToStatusHistoryItem({
      id: 'log-2',
      action: 'promoter.updated',
      old_values: { status: 'active', name: 'Acme' },
      new_values: { status: 'inactive', name: 'Acme' },
      created_at: '2026-07-19T11:00:00.000Z',
    })

    expect(item?.toStatus).toBe('inactive')
    expect(item?.fromStatus).toBe('active')
  })

  it('ignores promoter.updated when status unchanged', () => {
    const item = mapAuditLogToStatusHistoryItem({
      id: 'log-3',
      action: 'promoter.updated',
      old_values: { status: 'active', name: 'Acme' },
      new_values: { status: 'active', name: 'Acme Promotions' },
      created_at: '2026-07-19T12:00:00.000Z',
    })

    expect(item).toBeNull()
  })
})
