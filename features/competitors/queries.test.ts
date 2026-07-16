import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

const mockAdminFrom = vi.fn()
const mockExtendedFrom = vi.fn()

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(() => ({
    from: mockAdminFrom,
  })),
}))

vi.mock('@/lib/supabase/extended', () => ({
  createExtendedClient: vi.fn(async () => ({
    from: mockExtendedFrom,
  })),
}))

import { createAdminClient } from '@/lib/supabase/admin'
import { createExtendedClient } from '@/lib/supabase/extended'
import { getCompetitor, searchPublicGameFarms } from '@/features/competitors/queries'

function chainMaybeSingle(data: unknown) {
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data, error: null }),
  }
}

function chainList(data: unknown[]) {
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue({ data, error: null }),
  }
}

describe('searchPublicGameFarms', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('uses admin client and returns id and displayName only', async () => {
    mockAdminFrom.mockReturnValue(
      chainList([{ id: '00000000-0000-4000-8000-000000000001', display_name: 'Farm Alpha' }])
    )

    const results = await searchPublicGameFarms('farm')

    expect(createAdminClient).toHaveBeenCalled()
    expect(createExtendedClient).not.toHaveBeenCalled()
    expect(mockAdminFrom).toHaveBeenCalledWith('competitors')
    expect(results).toEqual([
      { id: '00000000-0000-4000-8000-000000000001', displayName: 'Farm Alpha' },
    ])
  })

  it('returns empty array for short queries', async () => {
    const results = await searchPublicGameFarms('a')
    expect(results).toEqual([])
    expect(createAdminClient).not.toHaveBeenCalled()
  })
})

describe('getCompetitor', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('uses session client by default', async () => {
    mockExtendedFrom.mockReturnValue(
      chainMaybeSingle({
        id: '00000000-0000-4000-8000-000000000002',
        display_name: 'Farm Beta',
        contact_full_name: null,
        contact_designation: null,
        contact_number: null,
        email: null,
        address: null,
      })
    )

    await getCompetitor('00000000-0000-4000-8000-000000000002')

    expect(createExtendedClient).toHaveBeenCalled()
    expect(createAdminClient).not.toHaveBeenCalled()
  })

  it('uses admin client when useAdminClient is true', async () => {
    mockAdminFrom.mockReturnValue(
      chainMaybeSingle({
        id: '00000000-0000-4000-8000-000000000003',
        display_name: 'Farm Gamma',
        contact_full_name: null,
        contact_designation: null,
        contact_number: null,
        email: 'gamma@example.com',
        address: null,
      })
    )

    const result = await getCompetitor('00000000-0000-4000-8000-000000000003', {
      useAdminClient: true,
    })

    expect(createAdminClient).toHaveBeenCalled()
    expect(createExtendedClient).not.toHaveBeenCalled()
    expect(result?.email).toBe('gamma@example.com')
  })
})
