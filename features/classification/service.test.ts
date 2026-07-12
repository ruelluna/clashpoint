import { describe, expect, it } from 'vitest'

import { getPairingStatusFromRules, normalizePairingValues } from '@/features/classification/schema'

describe('pairing matrix', () => {
  it('class A versus class A is allowed', () => {
    const status = getPairingStatusFromRules(
      [
        {
          classification_type: 'rooster_class',
          first_value: 'class_a',
          second_value: 'class_a',
          pairing_status: 'allowed',
        },
      ],
      'rooster_class',
      'class_a',
      'class_a'
    )
    expect(status).toBe('allowed')
  })

  it('class A versus class C is prohibited', () => {
    const status = getPairingStatusFromRules(
      [
        {
          classification_type: 'rooster_class',
          first_value: 'class_a',
          second_value: 'class_c',
          pairing_status: 'prohibited',
        },
      ],
      'rooster_class',
      'class_c',
      'class_a'
    )
    expect(status).toBe('prohibited')
  })

  it('pairing matrix is symmetrical', () => {
    const [a, b] = normalizePairingValues('class_b', 'class_a')
    expect(a).toBe('class_a')
    expect(b).toBe('class_b')
  })
})
