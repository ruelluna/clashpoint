import 'server-only'

import { cookies } from 'next/headers'

import {
  SESSION_TTL_MS,
  signSession,
  verifySession,
  type PublicRegistrationSession,
  getRegistrationOtpSecret,
} from '@/features/public/owner-verification'

export const PUBLIC_REG_SESSION_COOKIE = 'public_reg_session'

export async function setPublicRegistrationSession(
  payload: Omit<PublicRegistrationSession, 'exp'>
): Promise<void> {
  const secret = getRegistrationOtpSecret()
  const token = signSession(
    { ...payload, exp: Date.now() + SESSION_TTL_MS },
    secret
  )
  const cookieStore = await cookies()
  cookieStore.set(PUBLIC_REG_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: Math.floor(SESSION_TTL_MS / 1000),
  })
}

export async function getPublicRegistrationSession(): Promise<PublicRegistrationSession | null> {
  const secret = getRegistrationOtpSecret()
  const cookieStore = await cookies()
  const token = cookieStore.get(PUBLIC_REG_SESSION_COOKIE)?.value
  if (!token) return null
  return verifySession(token, secret)
}

export async function clearPublicRegistrationSession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(PUBLIC_REG_SESSION_COOKIE)
}
