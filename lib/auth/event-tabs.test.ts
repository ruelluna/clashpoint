import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

const { hasAnyPermission } = vi.hoisted(() => ({
  hasAnyPermission: vi.fn(),
}))

const { getProfile } = vi.hoisted(() => ({
  getProfile: vi.fn(),
}))

vi.mock('@/lib/auth/permissions', () => ({
  hasAnyPermission,
}))

vi.mock('@/lib/auth/queries', () => ({
  getProfile,
}))

import { getVisibleEventTabs } from '@/lib/auth/event-tabs'
import type { Profile } from '@/lib/auth/types'

const baseProfile: Profile = {
  id: '00000000-0000-4000-8000-000000000099',
  role: 'staff',
  display_name: 'Test User',
  is_active: true,
  deactivated_at: null,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
}

function tabSlugs(tabs: { slug: string; label: string }[]) {
  return tabs.map((tab) => tab.slug)
}

describe('getVisibleEventTabs', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('hides revolving fund for staff with payments.manage only', async () => {
    getProfile.mockResolvedValue({ ...baseProfile, role: 'staff' })
    hasAnyPermission.mockImplementation(async (_userId, permissions: string[]) => {
      if (permissions.includes('payments.manage')) return true
      if (permissions.includes('events.view')) return true
      return false
    })

    const tabs = await getVisibleEventTabs(baseProfile.id)

    expect(tabSlugs(tabs)).not.toContain('revolving-fund')
    expect(tabSlugs(tabs)).toContain('payments')
  })

  it('hides revolving fund for staff even when they have events.manage', async () => {
    getProfile.mockResolvedValue({ ...baseProfile, role: 'staff' })
    hasAnyPermission.mockImplementation(async (_userId, permissions: string[]) => {
      if (permissions.includes('events.manage')) return true
      if (permissions.includes('events.view')) return true
      return false
    })

    const tabs = await getVisibleEventTabs(baseProfile.id)

    expect(tabSlugs(tabs)).not.toContain('revolving-fund')
  })

  it('shows revolving fund for event organizers with events.manage', async () => {
    getProfile.mockResolvedValue({ ...baseProfile, role: 'event_organizer' })
    hasAnyPermission.mockImplementation(async (_userId, permissions: string[]) => {
      if (permissions.includes('events.manage')) return true
      if (permissions.includes('events.view')) return true
      return false
    })

    const tabs = await getVisibleEventTabs(baseProfile.id)

    expect(tabSlugs(tabs)).toContain('revolving-fund')
  })

  it('shows revolving fund for admins with all permissions', async () => {
    getProfile.mockResolvedValue({ ...baseProfile, role: 'admin' })
    hasAnyPermission.mockResolvedValue(true)

    const tabs = await getVisibleEventTabs(baseProfile.id)

    expect(tabSlugs(tabs)).toContain('revolving-fund')
  })
})
