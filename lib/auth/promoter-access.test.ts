import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

const { createClient } = vi.hoisted(() => ({
  createClient: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient,
}))

import {
  PROMOTER_DEACTIVATED_MESSAGE,
  PROMOTER_INACTIVE_MESSAGE,
  PROMOTER_NOT_LINKED_MESSAGE,
  PROMOTER_SUSPENDED_MESSAGE,
  canPromoterAccessApp,
  promoterStatusDeniedMessage,
  resolvePromoterSignInAccess,
} from '@/lib/auth/promoter-access'
import type { Profile } from '@/lib/auth/types'

const userId = '00000000-0000-4000-8000-000000000001'

function activeProfile(overrides: Partial<Profile> = {}): Profile {
  return {
    id: userId,
    role: 'promoter',
    display_name: 'Test Promoter',
    is_active: true,
    deactivated_at: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

function mockPromoterLookup(
  promoter: { id: string; status: string; user_id: string } | null
) {
  createClient.mockResolvedValue({
    from: vi.fn(() => ({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          is: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: promoter, error: null }),
          }),
        }),
      }),
    })),
  })
}

describe('promoterStatusDeniedMessage', () => {
  it('returns inactive message', () => {
    expect(promoterStatusDeniedMessage('inactive')).toBe(PROMOTER_INACTIVE_MESSAGE)
  })

  it('returns suspended message', () => {
    expect(promoterStatusDeniedMessage('suspended')).toBe(PROMOTER_SUSPENDED_MESSAGE)
  })

  it('returns null for active', () => {
    expect(promoterStatusDeniedMessage('active')).toBeNull()
  })
})

describe('resolvePromoterSignInAccess', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('allows active promoter with active profile', async () => {
    mockPromoterLookup({
      id: 'promoter-1',
      status: 'active',
      user_id: userId,
    })

    const result = await resolvePromoterSignInAccess(activeProfile())

    expect(result).toEqual({ allowed: true })
  })

  it('denies inactive promoter with specific message', async () => {
    mockPromoterLookup({
      id: 'promoter-1',
      status: 'inactive',
      user_id: userId,
    })

    const result = await resolvePromoterSignInAccess(activeProfile())

    expect(result).toEqual({
      allowed: false,
      message: PROMOTER_INACTIVE_MESSAGE,
    })
  })

  it('denies suspended promoter with specific message', async () => {
    mockPromoterLookup({
      id: 'promoter-1',
      status: 'suspended',
      user_id: userId,
    })

    const result = await resolvePromoterSignInAccess(activeProfile())

    expect(result).toEqual({
      allowed: false,
      message: PROMOTER_SUSPENDED_MESSAGE,
    })
  })

  it('denies when no promoter profile is linked', async () => {
    mockPromoterLookup(null)

    const result = await resolvePromoterSignInAccess(activeProfile())

    expect(result).toEqual({
      allowed: false,
      message: PROMOTER_NOT_LINKED_MESSAGE,
    })
  })

  it('denies deactivated profile when promoter status is active', async () => {
    mockPromoterLookup({
      id: 'promoter-1',
      status: 'active',
      user_id: userId,
    })

    const result = await resolvePromoterSignInAccess(
      activeProfile({ is_active: false })
    )

    expect(result).toEqual({
      allowed: false,
      message: PROMOTER_DEACTIVATED_MESSAGE,
    })
  })

  it('prefers suspended message over deactivated when both apply', async () => {
    mockPromoterLookup({
      id: 'promoter-1',
      status: 'suspended',
      user_id: userId,
    })

    const result = await resolvePromoterSignInAccess(
      activeProfile({ is_active: false })
    )

    expect(result).toEqual({
      allowed: false,
      message: PROMOTER_SUSPENDED_MESSAGE,
    })
  })
})

describe('canPromoterAccessApp', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns true for active linked promoter', async () => {
    mockPromoterLookup({
      id: 'promoter-1',
      status: 'active',
      user_id: userId,
    })

    await expect(canPromoterAccessApp(activeProfile())).resolves.toBe(true)
  })

  it('returns false for suspended promoter', async () => {
    mockPromoterLookup({
      id: 'promoter-1',
      status: 'suspended',
      user_id: userId,
    })

    await expect(canPromoterAccessApp(activeProfile())).resolves.toBe(false)
  })
})
