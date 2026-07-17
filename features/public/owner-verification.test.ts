import { describe, expect, it } from 'vitest'

import {
  generateOtpCode,
  hashOtp,
  maskEmail,
  signSession,
  verifyOtpHash,
  verifySession,
} from '@/features/public/owner-verification'

describe('owner verification utils', () => {
  const secret = 'test-pepper-secret'

  it('generates a 6-digit OTP', () => {
    const code = generateOtpCode()
    expect(code).toMatch(/^\d{6}$/)
  })

  it('hashes and verifies OTP codes', () => {
    const code = '123456'
    const hash = hashOtp(code, secret)
    expect(verifyOtpHash(code, secret, hash)).toBe(true)
    expect(verifyOtpHash('654321', secret, hash)).toBe(false)
  })

  it('signs and verifies session tokens', () => {
    const payload = {
      eventId: '00000000-0000-4000-8000-000000000001',
      entryId: '00000000-0000-4000-8000-000000000002',
      competitorId: '00000000-0000-4000-8000-000000000003',
      exp: Date.now() + 60_000,
    }
    const token = signSession(payload, secret)
    expect(verifySession(token, secret)).toEqual(payload)
  })

  it('rejects expired session tokens', () => {
    const payload = {
      eventId: '00000000-0000-4000-8000-000000000001',
      entryId: '00000000-0000-4000-8000-000000000002',
      competitorId: '00000000-0000-4000-8000-000000000003',
      exp: Date.now() - 1,
    }
    const token = signSession(payload, secret)
    expect(verifySession(token, secret)).toBeNull()
  })

  it('masks email addresses', () => {
    expect(maskEmail('juan@example.com')).toBe('j***@example.com')
  })
})
