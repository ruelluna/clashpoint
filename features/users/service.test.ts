import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

const { writeAuditLog, createAdminClient, createClient } = vi.hoisted(() => ({
  writeAuditLog: vi.fn(),
  createAdminClient: vi.fn(),
  createClient: vi.fn(),
}))

vi.mock('@/features/audit/service', () => ({
  writeAuditLog,
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient,
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient,
}))

import { inviteUser, updateUserModules, updateUserRole } from '@/features/users/service'

describe('inviteUser', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('stores expanded permissions for staff users', async () => {
    const deleteEq = vi.fn().mockResolvedValue({ error: null })
    const insert = vi.fn().mockResolvedValue({ error: null })
    const profileUpdateEq = vi.fn().mockResolvedValue({ error: null })
    const profileUpdate = vi.fn().mockReturnValue({ eq: profileUpdateEq })

    createAdminClient.mockReturnValue({
      auth: {
        admin: {
          createUser: vi.fn().mockResolvedValue({
            data: { user: { id: 'user-1' } },
            error: null,
          }),
          deleteUser: vi.fn(),
        },
      },
    })

    createClient.mockResolvedValue({
      from: vi.fn((table: string) => {
        if (table === 'profiles') {
          return {
            update: profileUpdate,
          }
        }

        if (table === 'user_permissions') {
          return {
            delete: vi.fn().mockReturnValue({ eq: deleteEq }),
            insert,
          }
        }

        throw new Error(`Unexpected table ${table}`)
      }),
    })

    const result = await inviteUser('actor-1', {
      email: 'staff@clashpoint.test',
      password: 'password123',
      role: 'staff',
      modules: ['registrations'],
    })

    expect(result.error).toBeUndefined()
    expect(insert).toHaveBeenCalledWith([
      { user_id: 'user-1', permission_id: 'entries.manage' },
      { user_id: 'user-1', permission_id: 'events.view' },
    ])
    expect(writeAuditLog).toHaveBeenCalled()
  })
})

describe('updateUserRole', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('rejects assigning promoter role from Users', async () => {
    const result = await updateUserRole('actor-1', {
      userId: '00000000-0000-4000-8000-000000000001',
      role: 'promoter' as 'staff',
    })

    expect(result.error).toContain('Promoters')
  })

  it('allows demoting an existing promoter user to staff', async () => {
    const profileUpdateEq = vi.fn().mockResolvedValue({ error: null })
    const profileUpdate = vi.fn().mockReturnValue({ eq: profileUpdateEq })
    const permissionsDeleteEq = vi.fn().mockResolvedValue({ error: null })

    createClient.mockResolvedValue({
      from: vi.fn((table: string) => {
        if (table === 'profiles') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { role: 'promoter' },
                }),
              }),
            }),
            update: profileUpdate,
          }
        }

        if (table === 'user_permissions') {
          return {
            delete: vi.fn().mockReturnValue({ eq: permissionsDeleteEq }),
          }
        }

        throw new Error(`Unexpected table ${table}`)
      }),
    })

    const result = await updateUserRole('actor-1', {
      userId: '00000000-0000-4000-8000-000000000001',
      role: 'staff',
    })

    expect(result.error).toBeUndefined()
    expect(profileUpdate).toHaveBeenCalledWith({ role: 'staff' })
    expect(writeAuditLog).toHaveBeenCalled()
  })
})

describe('updateUserModules', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('rejects module updates for non-staff users', async () => {
    createClient.mockResolvedValue({
      from: vi.fn(() => ({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { role: 'event_organizer' },
            }),
          }),
        }),
      })),
    })

    const result = await updateUserModules('actor-1', {
      userId: 'user-2',
      modules: ['payments'],
    })

    expect(result.error).toBe('Modules can only be updated for staff users')
  })
})
