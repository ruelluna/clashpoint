import { describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

import {
  canAccessDashboard,
  isSystemOwnerRole,
} from '@/lib/auth/permissions'
import type { AppRole } from '@/lib/auth/types'

describe('isSystemOwnerRole', () => {
  it('returns true for admin and system_owner', () => {
    expect(isSystemOwnerRole('admin')).toBe(true)
    expect(isSystemOwnerRole('system_owner')).toBe(true)
  })

  it('returns false for staff and public roles', () => {
    const nonOwnerRoles: AppRole[] = [
      'event_organizer',
      'registration_staff',
      'finance_staff',
      'weighing_staff',
      'matchmaker',
      'result_recorder',
      'promoter',
      'public_viewer',
    ]

    for (const role of nonOwnerRoles) {
      expect(isSystemOwnerRole(role)).toBe(false)
    }
  })
})

describe('canAccessDashboard', () => {
  it('returns true for dashboard staff roles', () => {
    const allowed: AppRole[] = [
      'admin',
      'system_owner',
      'event_organizer',
      'registration_staff',
      'finance_staff',
      'weighing_staff',
      'matchmaker',
      'result_recorder',
      'promoter',
    ]

    for (const role of allowed) {
      expect(canAccessDashboard(role)).toBe(true)
    }
  })

  it('returns false for public_viewer', () => {
    expect(canAccessDashboard('public_viewer')).toBe(false)
  })
})
