import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

const mockInsert = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    from: vi.fn(() => ({
      insert: mockInsert,
    })),
  })),
}))

import { writeAuditLog } from '@/features/audit/service'

describe('writeAuditLog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockInsert.mockResolvedValue({ error: null })
  })

  it('inserts shaped audit log payload', async () => {
    const result = await writeAuditLog({
      actorId: 'actor-1',
      action: 'user.role_updated',
      entityType: 'profile',
      entityId: 'user-1',
      oldValues: { role: 'staff' },
      newValues: { role: 'event_organizer' },
    })

    expect(result).toEqual({})
    expect(mockInsert).toHaveBeenCalledWith({
      actor_id: 'actor-1',
      action: 'user.role_updated',
      entity_type: 'profile',
      entity_id: 'user-1',
      old_values: { role: 'staff' },
      new_values: { role: 'event_organizer' },
    })
  })

  it('merges reason into newValues when both are provided', async () => {
    await writeAuditLog({
      actorId: 'actor-1',
      action: 'user.deactivated',
      entityType: 'profile',
      entityId: 'user-1',
      newValues: { is_active: false },
      reason: 'Left the organization',
    })

    expect(mockInsert).toHaveBeenCalledWith({
      actor_id: 'actor-1',
      action: 'user.deactivated',
      entity_type: 'profile',
      entity_id: 'user-1',
      old_values: null,
      new_values: { is_active: false, reason: 'Left the organization' },
    })
  })

  it('stores reason-only newValues when no other values are provided', async () => {
    await writeAuditLog({
      actorId: 'actor-1',
      action: 'user.deactivated',
      entityType: 'profile',
      entityId: 'user-1',
      reason: 'Policy violation',
    })

    expect(mockInsert).toHaveBeenCalledWith({
      actor_id: 'actor-1',
      action: 'user.deactivated',
      entity_type: 'profile',
      entity_id: 'user-1',
      old_values: null,
      new_values: { reason: 'Policy violation' },
    })
  })

  it('returns supabase error message on insert failure', async () => {
    mockInsert.mockResolvedValue({ error: { message: 'insert failed' } })

    const result = await writeAuditLog({
      actorId: 'actor-1',
      action: 'user.invited',
      entityType: 'profile',
      entityId: 'user-2',
    })

    expect(result).toEqual({ error: 'insert failed' })
  })
})
