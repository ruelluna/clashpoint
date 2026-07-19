import { describe, expect, it } from 'vitest'

import { canOperateAsStaff } from '@/lib/auth/operational-access'
import type { Profile } from '@/lib/auth/types'

function profile(role: Profile['role']): Profile {
  return {
    id: '00000000-0000-4000-8000-000000000001',
    role,
    display_name: 'Test User',
    is_active: true,
    deactivated_at: null,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
  }
}

describe('canOperateAsStaff', () => {
  it('returns false for admin and system_owner', () => {
    expect(canOperateAsStaff(profile('admin'))).toBe(false)
    expect(canOperateAsStaff(profile('system_owner'))).toBe(false)
  })

  it('returns true for operational roles', () => {
    expect(canOperateAsStaff(profile('staff'))).toBe(true)
    expect(canOperateAsStaff(profile('event_organizer'))).toBe(true)
    expect(canOperateAsStaff(profile('promoter'))).toBe(true)
  })
})
