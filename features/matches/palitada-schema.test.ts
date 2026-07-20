import { describe, expect, it } from 'vitest'

import {
  addPalitadaContributionSchema,
  deletePalitadaContributionSchema,
} from '@/features/matches/schema'

describe('palitada schemas', () => {
  it('accepts valid add palitada input', () => {
    const result = addPalitadaContributionSchema.safeParse({
      eventId: '11111111-1111-4111-8111-111111111111',
      matchId: '22222222-2222-4222-8222-222222222222',
      side: 'wala',
      contributorName: 'VIP Guest',
      contributorType: 'vip',
      amount: 1000,
    })

    expect(result.success).toBe(true)
  })

  it('rejects empty contributor name', () => {
    const result = addPalitadaContributionSchema.safeParse({
      eventId: '11111111-1111-4111-8111-111111111111',
      matchId: '22222222-2222-4222-8222-222222222222',
      side: 'wala',
      contributorName: '   ',
      amount: 1000,
    })

    expect(result.success).toBe(false)
  })

  it('accepts valid delete palitada input', () => {
    const result = deletePalitadaContributionSchema.safeParse({
      eventId: '11111111-1111-4111-8111-111111111111',
      matchId: '22222222-2222-4222-8222-222222222222',
      contributionId: '33333333-3333-4333-8333-333333333333',
    })

    expect(result.success).toBe(true)
  })
})
