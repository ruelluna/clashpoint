import 'server-only'

import { writeAuditLog } from '@/features/audit/service'
import { createPublicCompetitor } from '@/features/competitors/service'
import { getCompetitor } from '@/features/competitors/queries'
import { createEntry } from '@/features/entries/service'
import { sendRegistrationEmail } from '@/lib/email/resend'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  generateOtpCode,
  getRegistrationOtpSecret,
  hashOtp,
  isOtpTestMode,
  maskEmail,
  MAX_OTP_ATTEMPTS,
  MAX_OTP_SENDS_PER_WINDOW,
  OTP_EXPIRY_MS,
  OTP_SEND_WINDOW_MS,
  verifyOtpHash,
} from '@/features/public/owner-verification'
import type {
  CreatePublicOwnerInput,
  SendOwnerVerificationInput,
  VerifyOwnerVerificationInput,
} from '@/features/public/schema'
import { getPublicRegistrationEvent } from '@/features/public/queries'
import { setPublicRegistrationSession, getPublicRegistrationSession } from '@/features/public/session-cookie'

const ADMIN_WRITE = { useAdminClient: true } as const

const otpSendLog = new Map<string, number[]>()

function otpSendKey(eventId: string, competitorId: string): string {
  return `${eventId}:${competitorId}`
}

function canSendOtp(eventId: string, competitorId: string): boolean {
  const key = otpSendKey(eventId, competitorId)
  const now = Date.now()
  const recent = (otpSendLog.get(key) ?? []).filter(
    (timestamp) => now - timestamp < OTP_SEND_WINDOW_MS
  )
  otpSendLog.set(key, recent)
  return recent.length < MAX_OTP_SENDS_PER_WINDOW
}

function recordOtpSend(eventId: string, competitorId: string): void {
  const key = otpSendKey(eventId, competitorId)
  const recent = otpSendLog.get(key) ?? []
  recent.push(Date.now())
  otpSendLog.set(key, recent)
}

async function findEntryForCompetitor(
  eventId: string,
  competitorId: string
): Promise<{ id: string; entry_number: string } | null> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('entries')
    .select('id, entry_number')
    .eq('event_id', eventId)
    .eq('competitor_id', competitorId)
    .is('deleted_at', null)
    .maybeSingle()

  if (error) throw error
  if (!data) return null
  return {
    id: data.id as string,
    entry_number: data.entry_number as string,
  }
}

async function countRoostersForEntry(entryId: string): Promise<number> {
  const supabase = createAdminClient()
  const { count, error } = await supabase
    .from('rooster_event_registrations')
    .select('id', { count: 'exact', head: true })
    .eq('entry_id', entryId)

  if (error) throw error
  return count ?? 0
}

async function ensureEntryCapacity(
  eventId: string,
  entryId: string,
  cocksPerEntry: number,
  eventType: 'classic' | 'derby'
): Promise<{ error?: string }> {
  const count = await countRoostersForEntry(entryId)
  if (eventType === 'classic' && count >= 1) {
    return {
      error:
        'This game farm already has a rooster registered for this event. Contact the organizer if you need help.',
    }
  }
  if (count >= cocksPerEntry) {
    return {
      error: `This entry already has the maximum of ${cocksPerEntry} rooster(s) for this event.`,
    }
  }
  return {}
}

async function resolveEntryForCompetitor(input: {
  eventId: string
  competitorId: string
  ownerName: string
  contactFullName?: string
  contactDesignation?: string
  contactNumber?: string
  email?: string
  notes?: string
}): Promise<{ error?: string; entryId?: string; entryNumber?: string }> {
  const existing = await findEntryForCompetitor(input.eventId, input.competitorId)
  if (existing) {
    const event = await getPublicRegistrationEvent(input.eventId)
    if (!event) return { error: 'Event not found' }
    const capacityError = await ensureEntryCapacity(
      input.eventId,
      existing.id,
      event.cocks_per_entry,
      event.event_type
    )
    if (capacityError.error) return capacityError
    return { entryId: existing.id, entryNumber: existing.entry_number }
  }

  const result = await createEntry(
    null,
    {
      eventId: input.eventId,
      competitorId: input.competitorId,
      ownerName: input.ownerName,
      contactFullName: input.contactFullName,
      contactDesignation: input.contactDesignation,
      contactNumber: input.contactNumber,
      email: input.email,
      notes: input.notes,
      entrySource: 'online',
    },
    ADMIN_WRITE
  )

  if (result.error || !result.entryId) {
    return { error: result.error ?? 'Failed to create entry' }
  }

  return { entryId: result.entryId, entryNumber: result.entryNumber }
}

export async function createPublicOwnerRegistration(
  input: CreatePublicOwnerInput
): Promise<{
  error?: string
  entryId?: string
  entryNumber?: string
  competitorId?: string
}> {
  const event = await getPublicRegistrationEvent(input.eventId)
  if (!event) return { error: 'Event not found' }
  if (!event.registration_open) {
    return { error: 'Registration is closed for this event' }
  }

  const competitorResult = await createPublicCompetitor({
    displayName: input.ownerName,
    contactFullName: input.contactFullName,
    contactDesignation: input.contactDesignation,
    contactNumber: input.contactNumber,
    email: input.email,
    address: undefined,
    notes: input.notes,
  })

  if (competitorResult.error || !competitorResult.competitorId) {
    return { error: competitorResult.error ?? 'Failed to register game farm' }
  }

  const entryResult = await resolveEntryForCompetitor({
    eventId: input.eventId,
    competitorId: competitorResult.competitorId,
    ownerName: input.ownerName,
    contactFullName: input.contactFullName,
    contactDesignation: input.contactDesignation,
    contactNumber: input.contactNumber,
    email: input.email,
    notes: input.notes,
  })

  if (entryResult.error || !entryResult.entryId) {
    return { error: entryResult.error ?? 'Failed to create entry' }
  }

  await setPublicRegistrationSession({
    eventId: input.eventId,
    entryId: entryResult.entryId,
    competitorId: competitorResult.competitorId,
  })

  return {
    entryId: entryResult.entryId,
    entryNumber: entryResult.entryNumber,
    competitorId: competitorResult.competitorId,
  }
}

export async function sendPublicOwnerVerification(
  input: SendOwnerVerificationInput
): Promise<{ error?: string; maskedEmail?: string; testCode?: string }> {
  const event = await getPublicRegistrationEvent(input.eventId)
  if (!event) return { error: 'Event not found' }
  if (!event.registration_open) {
    return { error: 'Registration is closed for this event' }
  }

  if (!canSendOtp(input.eventId, input.competitorId)) {
    return { error: 'Too many verification requests. Please try again later.' }
  }

  const competitor = await getCompetitor(input.competitorId)
  if (!competitor) return { error: 'Game farm not found' }
  if (!competitor.email) {
    return {
      error:
        'This game farm has no email on file. Register as a new game farm or contact the organizer.',
    }
  }

  const code = generateOtpCode()
  const secret = getRegistrationOtpSecret()
  const codeHash = hashOtp(code, secret)
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS).toISOString()

  const supabase = createAdminClient()
  const { error: insertError } = await supabase.from('registration_owner_verifications').insert({
    event_id: input.eventId,
    competitor_id: input.competitorId,
    email: competitor.email,
    code_hash: codeHash,
    expires_at: expiresAt,
  })

  if (insertError) return { error: insertError.message }

  if (isOtpTestMode()) {
    console.info(
      `[REGISTRATION_OTP_TEST_MODE] event=${input.eventId} competitor=${input.competitorId} code=${code}`
    )
    recordOtpSend(input.eventId, input.competitorId)
    return { maskedEmail: maskEmail(competitor.email), testCode: code }
  }

  const emailResult = await sendRegistrationEmail({
    to: competitor.email,
    subject: `Verify your game farm registration — ${event.name}`,
    text: `Your verification code for ${event.name} is ${code}. It expires in 10 minutes. If you did not request this, ignore this email.`,
  })

  if (emailResult.error) return { error: emailResult.error }

  recordOtpSend(input.eventId, input.competitorId)
  return { maskedEmail: maskEmail(competitor.email) }
}

export async function verifyPublicOwnerVerification(
  input: VerifyOwnerVerificationInput
): Promise<{
  error?: string
  entryId?: string
  entryNumber?: string
  competitorId?: string
}> {
  const event = await getPublicRegistrationEvent(input.eventId)
  if (!event) return { error: 'Event not found' }
  if (!event.registration_open) {
    return { error: 'Registration is closed for this event' }
  }

  const competitor = await getCompetitor(input.competitorId)
  if (!competitor) return { error: 'Game farm not found' }

  const supabase = createAdminClient()
  const { data: verification, error: fetchError } = await supabase
    .from('registration_owner_verifications')
    .select('id, code_hash, expires_at, verified_at, attempt_count')
    .eq('event_id', input.eventId)
    .eq('competitor_id', input.competitorId)
    .is('verified_at', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (fetchError) return { error: fetchError.message }
  if (!verification) {
    return { error: 'No active verification code. Request a new code.' }
  }

  if (new Date(verification.expires_at as string).getTime() <= Date.now()) {
    return { error: 'Verification code has expired. Request a new code.' }
  }

  const attempts = Number(verification.attempt_count ?? 0)
  if (attempts >= MAX_OTP_ATTEMPTS) {
    return { error: 'Too many failed attempts. Request a new code.' }
  }

  const secret = getRegistrationOtpSecret()
  const valid = verifyOtpHash(input.code, secret, verification.code_hash as string)

  if (!valid) {
    await supabase
      .from('registration_owner_verifications')
      .update({ attempt_count: attempts + 1 })
      .eq('id', verification.id)
    return { error: 'Invalid verification code' }
  }

  await supabase
    .from('registration_owner_verifications')
    .update({ verified_at: new Date().toISOString(), attempt_count: attempts + 1 })
    .eq('id', verification.id)

  const entryResult = await resolveEntryForCompetitor({
    eventId: input.eventId,
    competitorId: input.competitorId,
    ownerName: competitor.displayName,
    contactFullName: competitor.contactFullName ?? undefined,
    contactDesignation: competitor.contactDesignation ?? undefined,
    contactNumber: competitor.contactNumber ?? undefined,
    email: competitor.email ?? undefined,
  })

  if (entryResult.error || !entryResult.entryId) {
    return { error: entryResult.error ?? 'Failed to resolve entry' }
  }

  await setPublicRegistrationSession({
    eventId: input.eventId,
    entryId: entryResult.entryId,
    competitorId: input.competitorId,
  })

  await writeAuditLog({
    actorId: null,
    action: 'entry.owner_verified',
    entityType: 'entry',
    entityId: entryResult.entryId,
    newValues: {
      event_id: input.eventId,
      competitor_id: input.competitorId,
      source: 'online',
    },
  })

  return {
    entryId: entryResult.entryId,
    entryNumber: entryResult.entryNumber,
    competitorId: input.competitorId,
  }
}

export async function getPublicRegistrationEntryContext(eventId: string): Promise<{
  error?: string
  entryId?: string
  entryNumber?: string
  competitorId?: string
  roosterCount?: number
  cocksPerEntry?: number
  eventType?: 'classic' | 'derby'
} | null> {
  const session = await getPublicRegistrationSession()
  if (!session || session.eventId !== eventId) return null

  const event = await getPublicRegistrationEvent(eventId)
  if (!event?.registration_open) {
    return { error: 'Registration is closed for this event' }
  }

  const supabase = createAdminClient()
  const { data: entry, error } = await supabase
    .from('entries')
    .select('entry_number')
    .eq('id', session.entryId)
    .eq('event_id', eventId)
    .maybeSingle()

  if (error) return { error: error.message }
  if (!entry) return { error: 'Registration session is no longer valid' }

  const roosterCount = await countRoostersForEntry(session.entryId)

  return {
    entryId: session.entryId,
    entryNumber: entry.entry_number as string,
    competitorId: session.competitorId,
    roosterCount,
    cocksPerEntry: event.cocks_per_entry,
    eventType: event.event_type,
  }
}
