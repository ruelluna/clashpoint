import { describe, expect, it } from 'vitest'

import { recordInspectionSchema } from '@/features/inspection/schema'

describe('recordInspectionSchema', () => {
  const base = {
    eventId: '00000000-0000-4000-8000-000000000001',
    registrationId: '00000000-0000-4000-8000-000000000002',
  }

  it('requires notes when inspection fails', () => {
    const result = recordInspectionSchema.safeParse({
      ...base,
      inspectionStatus: 'failed',
    })

    expect(result.success).toBe(false)
  })

  it('accepts pass without notes when weight workflow is handled server-side', () => {
    const result = recordInspectionSchema.safeParse({
      ...base,
      inspectionStatus: 'passed',
    })

    expect(result.success).toBe(true)
  })
})
