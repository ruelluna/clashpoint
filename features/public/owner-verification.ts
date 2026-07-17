import { createHash, createHmac, randomInt, timingSafeEqual } from 'crypto'

export const OTP_LENGTH = 6
export const OTP_EXPIRY_MS = 10 * 60 * 1000
export const SESSION_TTL_MS = 30 * 60 * 1000
export const MAX_OTP_ATTEMPTS = 5
export const MAX_OTP_SENDS_PER_WINDOW = 3
export const OTP_SEND_WINDOW_MS = 15 * 60 * 1000

export type PublicRegistrationSession = {
  eventId: string
  entryId: string
  competitorId: string
  exp: number
}

export function generateOtpCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(OTP_LENGTH, '0')
}

export function hashOtp(code: string, secret: string): string {
  return createHash('sha256').update(`${secret}:${code}`).digest('hex')
}

export function verifyOtpHash(code: string, secret: string, hash: string): boolean {
  const computed = hashOtp(code, secret)
  try {
    return timingSafeEqual(Buffer.from(computed), Buffer.from(hash))
  } catch {
    return false
  }
}

export function signSession(payload: PublicRegistrationSession, secret: string): string {
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const sig = createHmac('sha256', secret).update(data).digest('base64url')
  return `${data}.${sig}`
}

export function verifySession(
  token: string,
  secret: string
): PublicRegistrationSession | null {
  const dot = token.indexOf('.')
  if (dot <= 0) return null

  const data = token.slice(0, dot)
  const sig = token.slice(dot + 1)
  if (!data || !sig) return null

  const expected = createHmac('sha256', secret).update(data).digest('base64url')
  try {
    if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null
  } catch {
    return null
  }

  let payload: PublicRegistrationSession
  try {
    payload = JSON.parse(
      Buffer.from(data, 'base64url').toString()
    ) as PublicRegistrationSession
  } catch {
    return null
  }

  if (
    !payload.eventId ||
    !payload.entryId ||
    !payload.competitorId ||
    typeof payload.exp !== 'number'
  ) {
    return null
  }

  if (payload.exp < Date.now()) return null
  return payload
}

export function maskEmail(email: string): string {
  const [local, domain] = email.split('@')
  if (!local || !domain) return '***'
  return `${local.slice(0, 1)}***@${domain}`
}

export function getRegistrationOtpSecret(): string {
  const secret = process.env.REGISTRATION_OTP_SECRET
  if (!secret) {
    throw new Error('REGISTRATION_OTP_SECRET is not configured')
  }
  return secret
}

export function isOtpTestMode(): boolean {
  return process.env.REGISTRATION_OTP_TEST_MODE === 'true'
}
