import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

const { canPromoterAccessApp } = vi.hoisted(() => ({
  canPromoterAccessApp: vi.fn(),
}))

vi.mock('@/lib/auth/promoter-access', () => ({
  canPromoterAccessApp,
}))

const { createClient } = vi.hoisted(() => ({
  createClient: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient,
}))

vi.mock('@/lib/auth/queries', () => ({
  getProfile: vi.fn(),
}))

vi.mock('@/lib/auth/session', () => ({
  getUser: vi.fn(),
}))

const redirect = vi.hoisted(() => vi.fn())

vi.mock('next/navigation', () => ({
  redirect,
}))

import { getProfile } from '@/lib/auth/queries'
import { getUser } from '@/lib/auth/session'

import {
  canAccessDashboard,
  canAccessDashboardForProfile,
  canPerformEventOperation,
  isSystemOwnerRole,
  requireNonStaffAnyPermission,
} from '@/lib/auth/permissions'
import type { AppRole, Profile } from '@/lib/auth/types'

describe('isSystemOwnerRole', () => {
  it('returns true for admin and system_owner', () => {
    expect(isSystemOwnerRole('admin')).toBe(true)
    expect(isSystemOwnerRole('system_owner')).toBe(true)
  })

  it('returns false for simplified staff roles', () => {
    const nonOwnerRoles: AppRole[] = [
      'event_organizer',
      'promoter',
      'staff',
    ]

    for (const role of nonOwnerRoles) {
      expect(isSystemOwnerRole(role)).toBe(false)
    }
  })
})

describe('canAccessDashboard', () => {
  it('returns true for dashboard roles', () => {
    const allowed: AppRole[] = [
      'admin',
      'system_owner',
      'event_organizer',
      'promoter',
      'staff',
    ]

    for (const role of allowed) {
      expect(canAccessDashboard(role)).toBe(true)
    }
  })
})

describe('canAccessDashboardForProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    createClient.mockResolvedValue({
      from: vi.fn(() => ({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      })),
    })
  })

  const promoterProfile: Profile = {
    id: '00000000-0000-4000-8000-000000000001',
    role: 'promoter',
    display_name: 'Promoter',
    is_active: true,
    deactivated_at: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  }

  it('rejects suspended promoter accounts', async () => {
    canPromoterAccessApp.mockResolvedValue(false)

    await expect(canAccessDashboardForProfile(promoterProfile)).resolves.toBe(
      false
    )
    expect(canPromoterAccessApp).toHaveBeenCalledWith(promoterProfile)
  })

  it('allows active promoter accounts', async () => {
    canPromoterAccessApp.mockResolvedValue(true)

    await expect(canAccessDashboardForProfile(promoterProfile)).resolves.toBe(
      true
    )
  })

  it('rejects inactive staff without permissions', async () => {
    const staffProfile: Profile = {
      ...promoterProfile,
      role: 'staff',
      is_active: false,
    }

    await expect(canAccessDashboardForProfile(staffProfile)).resolves.toBe(false)
    expect(canPromoterAccessApp).not.toHaveBeenCalled()
  })
})

describe('requireNonStaffAnyPermission', () => {
  const staffProfile: Profile = {
    id: '00000000-0000-4000-8000-000000000002',
    role: 'staff',
    display_name: 'Staff',
    is_active: true,
    deactivated_at: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  }

  beforeEach(() => {
    vi.clearAllMocks()
    redirect.mockImplementation((path: string) => {
      throw new Error(`redirect:${path}`)
    })
    createClient.mockResolvedValue({
      from: vi.fn(() => ({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [{ permission_id: 'events.manage' }],
            error: null,
          }),
        }),
      })),
    })
  })

  it('redirects staff users even when they have the required permission', async () => {
    vi.mocked(getUser).mockResolvedValue({ id: staffProfile.id } as Awaited<
      ReturnType<typeof getUser>
    >)
    vi.mocked(getProfile).mockResolvedValue(staffProfile)

    await expect(
      requireNonStaffAnyPermission(['events.manage'])
    ).rejects.toThrow('redirect:/access-denied')
  })
})

describe('canPerformEventOperation', () => {
  const adminProfile: Profile = {
    id: '00000000-0000-4000-8000-000000000010',
    role: 'admin',
    display_name: 'Admin',
    is_active: true,
    deactivated_at: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  }

  const staffProfile: Profile = {
    id: '00000000-0000-4000-8000-000000000011',
    role: 'staff',
    display_name: 'Staff',
    is_active: true,
    deactivated_at: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  }

  beforeEach(() => {
    vi.clearAllMocks()
    createClient.mockResolvedValue({
      from: vi.fn(() => ({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      })),
    })
    vi.mocked(getProfile).mockImplementation(async (userId: string) => {
      if (userId === adminProfile.id) return adminProfile
      if (userId === staffProfile.id) return staffProfile
      return null
    })
  })

  it('returns true for system owner roles without granular permission checks', async () => {
    await expect(
      canPerformEventOperation(adminProfile, adminProfile.id, ['matches.palitada.manage'])
    ).resolves.toBe(true)
  })

  it('returns false for staff without the requested permission', async () => {
    await expect(
      canPerformEventOperation(staffProfile, staffProfile.id, ['matches.palitada.manage'])
    ).resolves.toBe(false)
  })
})
