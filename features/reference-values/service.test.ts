import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

const { createClient } = vi.hoisted(() => ({
  createClient: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient,
}))

import {
  findOrCreateReferenceValue,
  ReferenceValueNotInCatalogError,
  resolveCatalogReferenceValue,
  resolveEntryReferenceValues,
} from '@/features/reference-values/service'

describe('findOrCreateReferenceValue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns null for blank input', async () => {
    await expect(findOrCreateReferenceValue('breed', '   ')).resolves.toBeNull()
  })

  it('returns existing catalog name when normalized match exists', async () => {
    const maybeSingle = vi.fn().mockResolvedValue({
      data: { id: '1', name: 'Kelso' },
      error: null,
    })

    createClient.mockResolvedValue({
      from: vi.fn(() => ({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle,
            }),
          }),
        }),
      })),
    })

    await expect(findOrCreateReferenceValue('breed', 'kelso')).resolves.toBe('Kelso')
  })

  it('inserts a new value when not found', async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null })
    const single = vi.fn().mockResolvedValue({ data: { name: 'Roundhead' }, error: null })

    createClient.mockResolvedValue({
      from: vi.fn(() => ({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle,
            }),
          }),
        }),
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single,
          }),
        }),
      })),
    })

    await expect(findOrCreateReferenceValue('breed', 'Roundhead')).resolves.toBe('Roundhead')
  })
})

describe('resolveCatalogReferenceValue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('throws when value is not in catalog', async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null })

    createClient.mockResolvedValue({
      from: vi.fn(() => ({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle,
            }),
          }),
        }),
      })),
    })

    await expect(resolveCatalogReferenceValue('breed', 'Unknown')).rejects.toBeInstanceOf(
      ReferenceValueNotInCatalogError
    )
  })
})

describe('resolveEntryReferenceValues', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('uses findOrCreate for public breed when allowed', async () => {
    const maybeSingle = vi
      .fn()
      .mockResolvedValueOnce({ data: null, error: null })
      .mockResolvedValueOnce({ data: { name: 'Black' }, error: null })
    const single = vi.fn().mockResolvedValue({ data: { name: 'New Breed' }, error: null })

    createClient.mockResolvedValue({
      from: vi.fn(() => ({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle,
            }),
          }),
        }),
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single,
          }),
        }),
      })),
    })

    const result = await resolveEntryReferenceValues(
      { breed: 'New Breed', colorMarking: 'Black' },
      { mode: 'public', allowBreedAdd: true, allowColorAdd: false }
    )

    expect(result.breed).toBe('New Breed')
    expect(result.colorMarking).toBe('Black')
  })
})
