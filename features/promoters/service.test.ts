import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

const { writeAuditLog, createClient } = vi.hoisted(() => ({
  writeAuditLog: vi.fn(),
  createClient: vi.fn(),
}))

vi.mock('@/features/audit/service', () => ({
  writeAuditLog,
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient,
}))

import { updatePromoter } from '@/features/promoters/service'

const promoterId = '00000000-0000-4000-8000-000000000001'
const actorId = '00000000-0000-4000-8000-000000000099'

const existingPromoter = {
  name: 'Acme Promotions',
  contact_person: null,
  phone: null,
  email: null,
  address: null,
  status: 'active' as const,
  commission_type: 'none' as const,
  commission_value: null,
  notes: null,
  user_id: null as string | null,
}

const linkedUserId = '00000000-0000-4000-8000-000000000010'

function mockPromoterUpdate(existing = existingPromoter) {
  const promotersUpdateEq = vi.fn().mockResolvedValue({ error: null })
  const promotersUpdate = vi.fn().mockReturnValue({ eq: promotersUpdateEq })
  const profilesUpdateEq = vi.fn().mockResolvedValue({ error: null })
  const profilesUpdate = vi.fn().mockReturnValue({ eq: profilesUpdateEq })

  createClient.mockResolvedValue({
    from: vi.fn((table: string) => {
      if (table === 'profiles') {
        return { update: profilesUpdate }
      }

      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            is: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: existing }),
            }),
          }),
        }),
        update: promotersUpdate,
      }
    }),
  })

  return { promotersUpdate, promotersUpdateEq, profilesUpdate, profilesUpdateEq }
}

describe('updatePromoter status audit logging', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    writeAuditLog.mockResolvedValue({})
  })

  it('writes promoter.status_changed with reason when status changes', async () => {
    mockPromoterUpdate()

    const result = await updatePromoter(actorId, {
      promoterId,
      name: existingPromoter.name,
      commissionType: 'none',
      status: 'suspended',
      statusChangeReason: 'Policy violation',
    })

    expect(result.error).toBeUndefined()
    expect(writeAuditLog).toHaveBeenCalledTimes(1)
    expect(writeAuditLog).toHaveBeenCalledWith({
      actorId,
      action: 'promoter.status_changed',
      entityType: 'promoter',
      entityId: promoterId,
      oldValues: { status: 'active' },
      newValues: { status: 'suspended' },
      reason: 'Policy violation',
    })
  })

  it('writes promoter.updated when non-status fields change', async () => {
    mockPromoterUpdate()

    const result = await updatePromoter(actorId, {
      promoterId,
      name: 'Acme Promotions LLC',
      commissionType: 'none',
      status: 'active',
    })

    expect(result.error).toBeUndefined()
    expect(writeAuditLog).toHaveBeenCalledTimes(1)
    expect(writeAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'promoter.updated',
        entityId: promoterId,
      })
    )
  })

  it('writes both logs when status and profile fields change', async () => {
    mockPromoterUpdate()

    const result = await updatePromoter(actorId, {
      promoterId,
      name: 'Acme Promotions LLC',
      commissionType: 'none',
      status: 'inactive',
      statusChangeReason: 'Season ended',
    })

    expect(result.error).toBeUndefined()
    expect(writeAuditLog).toHaveBeenCalledTimes(2)
    expect(writeAuditLog).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        action: 'promoter.updated',
      })
    )
    expect(writeAuditLog).toHaveBeenNthCalledWith(2, {
      actorId,
      action: 'promoter.status_changed',
      entityType: 'promoter',
      entityId: promoterId,
      oldValues: { status: 'active' },
      newValues: { status: 'inactive' },
      reason: 'Season ended',
    })
  })
})

describe('updatePromoter linked profile sync', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    writeAuditLog.mockResolvedValue({})
  })

  it('deactivates linked profile when status becomes suspended', async () => {
    const { profilesUpdate, profilesUpdateEq } = mockPromoterUpdate({
      ...existingPromoter,
      user_id: linkedUserId,
    })

    const result = await updatePromoter(actorId, {
      promoterId,
      name: existingPromoter.name,
      commissionType: 'none',
      status: 'suspended',
      statusChangeReason: 'Policy violation',
    })

    expect(result.error).toBeUndefined()
    expect(profilesUpdate).toHaveBeenCalledWith({
      is_active: false,
      deactivated_at: expect.any(String),
    })
    expect(profilesUpdateEq).toHaveBeenCalledWith('id', linkedUserId)
  })

  it('reactivates linked profile when status becomes active', async () => {
    const { profilesUpdate, profilesUpdateEq } = mockPromoterUpdate({
      ...existingPromoter,
      status: 'inactive',
      user_id: linkedUserId,
    })

    const result = await updatePromoter(actorId, {
      promoterId,
      name: existingPromoter.name,
      commissionType: 'none',
      status: 'active',
      statusChangeReason: 'Season resumed',
    })

    expect(result.error).toBeUndefined()
    expect(profilesUpdate).toHaveBeenCalledWith({
      is_active: true,
      deactivated_at: null,
    })
    expect(profilesUpdateEq).toHaveBeenCalledWith('id', linkedUserId)
  })

  it('does not update profile when promoter has no linked login', async () => {
    const { profilesUpdate } = mockPromoterUpdate({
      ...existingPromoter,
      user_id: null,
    })

    const result = await updatePromoter(actorId, {
      promoterId,
      name: existingPromoter.name,
      commissionType: 'none',
      status: 'suspended',
      statusChangeReason: 'Policy violation',
    })

    expect(result.error).toBeUndefined()
    expect(profilesUpdate).not.toHaveBeenCalled()
  })
})
