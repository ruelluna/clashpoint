import { describe, expect, it } from 'vitest'

import { updateSettingsSchema } from '@/features/settings/schema'

describe('updateSettingsSchema', () => {
  const valid = {
    orgName: 'ClashPoint',
    defaultVenue: 'Main Arena',
    legalDisclaimer: 'Licensed derby operators only.',
    termsAccepted: true,
  }

  it('accepts valid settings input', () => {
    expect(updateSettingsSchema.safeParse(valid).success).toBe(true)
  })

  it('rejects empty org name', () => {
    const result = updateSettingsSchema.safeParse({ ...valid, orgName: '' })
    expect(result.success).toBe(false)
  })

  it('rejects empty default venue', () => {
    const result = updateSettingsSchema.safeParse({ ...valid, defaultVenue: '' })
    expect(result.success).toBe(false)
  })

  it('rejects org name over 200 characters', () => {
    const result = updateSettingsSchema.safeParse({
      ...valid,
      orgName: 'a'.repeat(201),
    })
    expect(result.success).toBe(false)
  })

  it('rejects legal disclaimer shorter than 10 characters', () => {
    const result = updateSettingsSchema.safeParse({
      ...valid,
      legalDisclaimer: 'too short',
    })
    expect(result.success).toBe(false)
  })

  it('rejects legal disclaimer over 2000 characters', () => {
    const result = updateSettingsSchema.safeParse({
      ...valid,
      legalDisclaimer: 'a'.repeat(2001),
    })
    expect(result.success).toBe(false)
  })

  it('requires termsAccepted to be a boolean', () => {
    const result = updateSettingsSchema.safeParse({
      ...valid,
      termsAccepted: 'yes',
    })
    expect(result.success).toBe(false)
  })
})
