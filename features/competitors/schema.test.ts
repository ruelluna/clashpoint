import { describe, expect, it } from 'vitest'

import {
  createCompetitorSchema,
  deleteCompetitorSchema,
  listCompetitorsSchema,
  updateCompetitorSchema,
} from '@/features/competitors/schema'

describe('createCompetitorSchema', () => {
  it('accepts a valid owner profile', () => {
    const parsed = createCompetitorSchema.parse({
      displayName: 'Blue Ridge Farm',
      contactNumber: '+639171234567',
      email: 'farm@example.com',
      address: 'Cebu',
      notes: 'Regular entrant',
    })

    expect(parsed.displayName).toBe('Blue Ridge Farm')
    expect(parsed.notes).toBe('Regular entrant')
  })

  it('rejects an empty display name', () => {
    const result = createCompetitorSchema.safeParse({
      displayName: '',
    })

    expect(result.success).toBe(false)
  })
})

describe('updateCompetitorSchema', () => {
  it('requires a valid competitor id', () => {
    const result = updateCompetitorSchema.safeParse({
      id: 'not-a-uuid',
      displayName: 'Updated Farm',
    })

    expect(result.success).toBe(false)
  })
})

describe('deleteCompetitorSchema', () => {
  it('parses a competitor id', () => {
    const parsed = deleteCompetitorSchema.parse({
      id: '00000000-0000-4000-8000-000000000010',
    })

    expect(parsed.id).toBe('00000000-0000-4000-8000-000000000010')
  })
})

describe('listCompetitorsSchema', () => {
  it('applies defaults for list queries', () => {
    const parsed = listCompetitorsSchema.parse({})

    expect(parsed).toEqual({
      search: '',
      limit: 50,
      offset: 0,
    })
  })
})
