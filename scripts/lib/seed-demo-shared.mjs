/**
 * Shared helpers for classic/derby demo seed scripts.
 * Uses service role — never import into the Next.js app.
 */

import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'

function loadEnvFile(relativePath, { override = false } = {}) {
  const filePath = path.join(process.cwd(), relativePath)
  if (!fs.existsSync(filePath)) return

  const content = fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '')
  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const separatorIndex = trimmed.indexOf('=')
    if (separatorIndex === -1) continue
    const key = trimmed.slice(0, separatorIndex).trim()
    let value = trimmed.slice(separatorIndex + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    if (override || !(key in process.env)) {
      process.env[key] = value
    }
  }
}

export function loadEnvFiles() {
  loadEnvFile('.env.local')
  loadEnvFile('.env')
}

/** Parse `npm run seed:* -- --linked` style flags. */
export function parseSeedCliArgs(argv = process.argv.slice(2)) {
  return { linked: argv.includes('--linked') }
}

function readLinkedProjectRef() {
  const refPath = path.join(process.cwd(), 'supabase', '.temp', 'project-ref')
  if (!fs.existsSync(refPath)) {
    throw new Error(
      'No linked Supabase project found. Run: supabase link --project-ref <ref>'
    )
  }

  const ref = fs.readFileSync(refPath, 'utf8').trim()
  if (!ref) {
    throw new Error('Linked project ref is empty. Re-run supabase link.')
  }

  return ref
}

function readLinkedProjectMeta(projectRef) {
  const metaPath = path.join(process.cwd(), 'supabase', '.temp', 'linked-project.json')
  if (!fs.existsSync(metaPath)) {
    return { ref: projectRef, name: projectRef }
  }

  try {
    const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'))
    return {
      ref: meta.ref ?? projectRef,
      name: meta.name ?? projectRef,
    }
  } catch {
    return { ref: projectRef, name: projectRef }
  }
}

function runSupabaseCommand(args) {
  const options = {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }

  if (process.platform === 'win32') {
    return execFileSync('supabase.cmd', args, { ...options, shell: true })
  }

  return execFileSync('supabase', args, options)
}

function fetchLinkedServiceRoleKey(projectRef) {
  const output = runSupabaseCommand([
    'projects',
    'api-keys',
    '--project-ref',
    projectRef,
    '-o',
    'json',
  ])

  const keys = JSON.parse(output.trim())
  if (!Array.isArray(keys)) {
    throw new Error('Unexpected supabase projects api-keys output.')
  }

  const serviceRole = keys.find((key) => key.name === 'service_role' && key.type === 'legacy')
  if (!serviceRole?.api_key) {
    throw new Error('Could not resolve service_role key for linked project.')
  }

  return serviceRole.api_key
}

/**
 * Point seed scripts at the Supabase project from `supabase link` (not local `supabase status`).
 * Optional `.env.linked` can supply SUPABASE_SERVICE_ROLE_KEY if CLI key fetch is unavailable.
 */
export function applyLinkedSupabaseEnv() {
  delete process.env.SUPABASE_SERVICE_ROLE_KEY
  delete process.env.NEXT_PUBLIC_SUPABASE_URL
  loadEnvFile('.env.linked', { override: true })

  const projectRef = readLinkedProjectRef()
  const meta = readLinkedProjectMeta(projectRef)
  const url = `https://${projectRef}.supabase.co`

  process.env.NEXT_PUBLIC_SUPABASE_URL = url

  try {
    process.env.SUPABASE_SERVICE_ROLE_KEY = fetchLinkedServiceRoleKey(projectRef)
  } catch (error) {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error(
        `${error instanceof Error ? error.message : String(error)} ` +
          'Run supabase login, or set SUPABASE_SERVICE_ROLE_KEY in .env.linked.'
      )
    }
  }

  console.log(`Target: linked Supabase — ${meta.name} (${projectRef})`)
  console.log(`API URL: ${url}`)
  console.warn('WARNING: seed writes go to the linked remote project, not local Supabase.')

  return meta
}

/** Load env files, optionally switch to linked Supabase when `--linked` is passed. */
export function prepareSeedEnvironment(argv = process.argv.slice(2)) {
  const { linked } = parseSeedCliArgs(argv)

  if (linked) {
    applyLinkedSupabaseEnv()
    loadEnvFile('.env.local')
    loadEnvFile('.env')
  } else {
    loadEnvFiles()
  }

  return { linked }
}

export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRoleKey) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. ' +
        'Add them to .env.local, or run with --linked after supabase link.'
    )
  }

  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

async function findUserByEmail(supabase, email) {
  let page = 1
  const perPage = 200

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage })
    if (error) throw error

    const match = data.users.find(
      (user) => user.email?.toLowerCase() === email.toLowerCase()
    )
    if (match) return match

    if (data.users.length < perPage) return null
    page += 1
  }
}

function seedAdminCredentials() {
  return {
    email: process.env.SEED_FIRST_ADMIN_EMAIL ?? 'ruelluna@gmail.com',
    password: process.env.SEED_FIRST_ADMIN_PASSWORD ?? 'password',
    displayName: process.env.SEED_FIRST_ADMIN_DISPLAY_NAME ?? 'Ruel Luna',
  }
}

async function createBootstrapAdminUser(supabase, { email, password, displayName }) {
  const { data: created, error: createError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { display_name: displayName },
  })

  if (createError || !created.user) {
    if (createError?.message?.toLowerCase().includes('already been registered')) {
      const existing = await findUserByEmail(supabase, email)
      if (!existing) {
        throw new Error(`Email ${email} is registered but user lookup failed.`)
      }
      return existing
    }
    throw new Error(createError?.message ?? 'Failed to create bootstrap admin user')
  }

  console.log(`Created bootstrap admin ${email} (user id: ${created.user.id})`)
  return created.user
}

async function waitForProfile(supabase, userId, email, attempts = 10) {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id, display_name, role')
      .eq('id', userId)
      .maybeSingle()

    if (error) throw error
    if (profile) return profile

    await new Promise((resolve) => setTimeout(resolve, 200))
  }

  throw new Error(`Profile missing for ${email} (${userId}) after bootstrap.`)
}

async function ensureBootstrapAdminIfNeeded(supabase) {
  const { email, password, displayName } = seedAdminCredentials()
  let user = await findUserByEmail(supabase, email)

  if (user) return user

  const { data: needsBootstrap, error: bootstrapError } = await supabase.rpc('needs_bootstrap')
  if (bootstrapError) {
    throw new Error(`Unable to verify bootstrap state: ${bootstrapError.message}`)
  }

  if (!needsBootstrap) {
    throw new Error(
      `No auth user for ${email} and bootstrap is already complete. ` +
        'Use an existing admin or run npm run seed:first-admin.'
    )
  }

  user = await createBootstrapAdminUser(supabase, { email, password, displayName })
  return user
}

export async function resolveSeedActor(supabase) {
  const { email } = seedAdminCredentials()
  const user = await ensureBootstrapAdminIfNeeded(supabase)

  const profile = await waitForProfile(supabase, user.id, email)

  return { userId: user.id, email, profile }
}

export async function resolveVenue(supabase) {
  const { data, error } = await supabase
    .from('system_settings')
    .select('key, value')
    .eq('key', 'default_venue')
    .maybeSingle()

  if (error) throw error
  const venue = typeof data?.value === 'string' ? data.value.trim() : ''
  return venue || 'Seed Arena'
}

export function eventIdPrefix(eventId) {
  return eventId.replace(/-/g, '').slice(0, 8).toUpperCase()
}

export function formatEntryNumber(sequence) {
  return String(sequence).padStart(3, '0')
}

export function formatOwnerBarcode(eventId, sequence) {
  return `OWN-${eventIdPrefix(eventId)}-${String(sequence).padStart(4, '0')}`
}

export function formatCockEntryBarcode(eventId, sequence) {
  return `COCK-${eventIdPrefix(eventId)}-${String(sequence).padStart(4, '0')}`
}

export function formatPaymentReference(eventId, sequence) {
  return `PAY-${eventIdPrefix(eventId)}-${String(sequence).padStart(4, '0')}`
}

export function formatMatchBetBarcode(eventId, fightNumber, side) {
  const prefix = eventIdPrefix(eventId)
  const sideCode = side === 'meron' ? 'M' : 'W'
  return `BET-${prefix}-${String(fightNumber).padStart(4, '0')}-${sideCode}`
}

function feesRequiredForRegPayment(fees) {
  return (
    (fees.registrationFeeEnabled && fees.registrationFeeAmount > 0) ||
    (fees.roosterEntryFeeEnabled && fees.roosterEntryFeeAmount > 0) ||
    (fees.cashBondEnabled && fees.cashBondAmount > 0)
  )
}

/** Mirrors syncRegistrationPaymentStatus tier mapping in features/payments/service.ts */
export function deriveRegPaymentStatus(tier, fees) {
  if (!feesRequiredForRegPayment(fees)) return 'not_required'
  if (tier === 'paid') return 'paid'
  if (tier === 'partial') return 'partial'
  return 'unpaid'
}

/** Default lifecycle status for cashier + matching demo seeds. */
export const DEMO_EVENT_STATUS = 'in_progress'

export function feeSnapshotFromSettings(settings) {
  return {
    registrationFeeEnabled: settings.registrationFeeEnabled,
    registrationFeeAmount: settings.registrationFeeAmount,
    roosterEntryFeeEnabled: settings.roosterEntryFeeEnabled,
    roosterEntryFeeAmount: settings.roosterEntryFeeAmount,
    cashBondEnabled: settings.cashBondEnabled,
    cashBondAmount: settings.cashBondAmount,
  }
}

export function computeCategoryDue(category, settings, roosterCount) {
  switch (category) {
    case 'registration':
      return settings.registrationFeeEnabled ? settings.registrationFeeAmount : 0
    case 'rooster_entry':
      return settings.roosterEntryFeeEnabled
        ? Number((settings.roosterEntryFeeAmount * roosterCount).toFixed(2))
        : 0
    case 'cash_bond':
      return settings.cashBondEnabled ? settings.cashBondAmount : 0
    default:
      return 0
  }
}

export function computeTotalDue(settings, roosterCount) {
  return Number(
    (
      computeCategoryDue('registration', settings, roosterCount) +
      computeCategoryDue('rooster_entry', settings, roosterCount) +
      computeCategoryDue('cash_bond', settings, roosterCount)
    ).toFixed(2)
  )
}

/** paymentTier: 'unpaid' | 'partial' | 'paid' by owner index */
export function paymentTierForIndex(index, ownerCount) {
  if (ownerCount <= 3) {
    return index === 0 ? 'unpaid' : index === 1 ? 'partial' : 'paid'
  }

  const unpaidEnd = Math.ceil(ownerCount / 2)
  const partialEnd = unpaidEnd + Math.max(1, Math.floor(ownerCount / 4))

  if (index < unpaidEnd) return 'unpaid'
  if (index < partialEnd) return 'partial'
  return 'paid'
}

export async function deleteSeedEventsByName(supabase, eventName) {
  const { data: existing, error } = await supabase
    .from('events')
    .select('id, name, is_active')
    .eq('name', eventName)

  if (error) throw error
  if (!existing?.length) return []

  const ids = existing.map((row) => row.id)
  const { error: deleteError } = await supabase.from('events').delete().in('id', ids)
  if (deleteError) throw deleteError

  console.log(`Removed ${ids.length} prior seed event(s) named "${eventName}".`)
  return existing
}

/**
 * Clears any current active event, then marks the seed event active.
 * Differs from UI setEventActive, which errors when a peer is already active.
 */
export async function activateSeedEvent(supabase, eventId) {
  const { data: peer, error: peerError } = await supabase
    .from('events')
    .select('id, name')
    .eq('is_active', true)
    .is('deleted_at', null)
    .neq('id', eventId)
    .maybeSingle()

  if (peerError) throw peerError

  if (peer) {
    const { error: clearError } = await supabase
      .from('events')
      .update({ is_active: false })
      .eq('id', peer.id)

    if (clearError) throw clearError
    console.log(`Cleared previous active event: ${peer.name} (${peer.id})`)
  } else {
    console.log('No previous active event.')
  }

  const { error: activateError } = await supabase
    .from('events')
    .update({ is_active: true })
    .eq('id', eventId)
    .is('deleted_at', null)

  if (activateError) throw activateError

  const { data: activated, error: fetchError } = await supabase
    .from('events')
    .select('id, name, is_active')
    .eq('id', eventId)
    .single()

  if (fetchError) throw fetchError
  console.log(`Active event is now: ${activated.name} (${activated.id})`)
  return { previous: peer, activated }
}

export async function insertOpeningRevolvingFund(supabase, { eventId, actorId, amount }) {
  const openingAmount = Number(Math.max(0, amount).toFixed(2))

  const { error } = await supabase.from('event_revolving_fund_ledger').insert({
    event_id: eventId,
    entry_type: 'opening',
    amount: openingAmount,
    balance_after: openingAmount,
    description: 'Opening revolving fund balance',
    created_by: actorId,
  })

  if (error) throw error
  return openingAmount
}

/**
 * Mirrors recordPayment → postRevolvingFundLedgerEntry(collection).
 * Mutates ledgerBalanceRef.current after each post.
 */
export async function postSeedCollectionLedgerEntry(
  supabase,
  { eventId, actorId, paymentId, paymentReference, entryName, amountPaid, ledgerBalanceRef }
) {
  const amount = Number(Math.max(0, amountPaid).toFixed(2))
  ledgerBalanceRef.current = Number((ledgerBalanceRef.current + amount).toFixed(2))

  const basePayload = {
    event_id: eventId,
    entry_type: 'collection',
    amount,
    balance_after: ledgerBalanceRef.current,
    description: `Collection ${paymentReference} — ${entryName}`,
    created_by: actorId,
  }

  if (paymentId) {
    const { error: linkedError } = await supabase
      .from('event_revolving_fund_ledger')
      .insert({ ...basePayload, source_payment_id: paymentId })

    if (!linkedError) return ledgerBalanceRef.current

    if (linkedError.code !== 'PGRST204') throw linkedError
  }

  const { error } = await supabase.from('event_revolving_fund_ledger').insert(basePayload)
  if (error) throw error
  return ledgerBalanceRef.current
}

async function insertSeedPaymentWithCollection(
  supabase,
  {
    eventId,
    actorId,
    entryId,
    entryName,
    paymentSeq,
    amountDue,
    paymentCategory,
    notes,
    paidAt,
    ledgerBalanceRef,
    tallies,
  }
) {
  const paymentReference = formatPaymentReference(eventId, paymentSeq)
  const amountPaid = Number(amountDue.toFixed(2))

  const { data: payment, error: payError } = await supabase
    .from('payments')
    .insert({
      payment_reference: paymentReference,
      entry_id: entryId,
      event_id: eventId,
      amount_due: amountPaid,
      amount_paid: amountPaid,
      balance: 0,
      payment_method: 'cash',
      payment_status: 'paid',
      payment_category: paymentCategory,
      received_by: actorId,
      paid_at: paidAt,
      notes,
    })
    .select('id')
    .single()

  if (payError) throw payError

  await postSeedCollectionLedgerEntry(supabase, {
    eventId,
    actorId,
    paymentId: payment.id,
    paymentReference,
    entryName,
    amountPaid,
    ledgerBalanceRef,
  })

  tallies.collections += 1
  tallies.collectedAmount = Number((tallies.collectedAmount + amountPaid).toFixed(2))
}

async function insertSeedMatchBetPayment(
  supabase,
  {
    eventId,
    actorId,
    matchId,
    matchBetId,
    entryId,
    entryName,
    fightNumber,
    side,
    amountDue,
    paymentSeq,
    paidAt,
    ledgerBalanceRef,
    tallies,
  }
) {
  const paymentReference = formatPaymentReference(eventId, paymentSeq)
  const amountPaid = Number(amountDue.toFixed(2))

  const { data: payment, error: payError } = await supabase
    .from('payments')
    .insert({
      payment_reference: paymentReference,
      entry_id: entryId,
      event_id: eventId,
      amount_due: amountPaid,
      amount_paid: amountPaid,
      balance: 0,
      payment_method: 'cash',
      payment_status: 'paid',
      payment_category: 'match_bet',
      match_bet_id: matchBetId,
      match_id: matchId,
      fight_side: side,
      received_by: actorId,
      paid_at: paidAt,
      notes: 'Seed pledge payment',
    })
    .select('id')
    .single()

  if (payError) throw payError

  const { error: betUpdateError } = await supabase
    .from('match_bets')
    .update({
      payment_status: 'paid',
      payment_id: payment.id,
      updated_at: paidAt,
    })
    .eq('id', matchBetId)

  if (betUpdateError) throw betUpdateError

  await postSeedCollectionLedgerEntry(supabase, {
    eventId,
    actorId,
    paymentId: payment.id,
    paymentReference,
    entryName: `${entryName} — Fight #${fightNumber} ${side}`,
    amountPaid,
    ledgerBalanceRef,
  })

  tallies.collections += 1
  tallies.collectedAmount = Number((tallies.collectedAmount + amountPaid).toFixed(2))

  return payment.id
}

async function markSeedRoostersMatched(supabase, roosterIds) {
  const { error } = await supabase
    .from('rooster_event_registrations')
    .update({ registration_status: 'matched' })
    .in('id', roosterIds)

  if (error) throw error
}

function pickRooster(entry, cockNumber) {
  const rooster = entry.roosters.find((row) => row.cockNumber === cockNumber)
  if (!rooster) {
    throw new Error(
      `Seed match setup: entry "${entry.entryName}" has no cock #${cockNumber}`
    )
  }
  return rooster
}

async function insertSeedMatchWithBets(
  supabase,
  {
    eventId,
    actorId,
    fightNumber,
    meronEntry,
    meronRooster,
    walaEntry,
    walaRooster,
    status,
    queueStatus,
    meronBet,
    walaBet,
  }
) {
  const { data: match, error: matchError } = await supabase
    .from('matches')
    .insert({
      event_id: eventId,
      fight_number: fightNumber,
      round_number: 1,
      meron_entry_id: meronEntry.entryId,
      meron_rooster_id: meronRooster.id,
      meron_weight: meronRooster.weightGrams / 1000,
      wala_entry_id: walaEntry.entryId,
      wala_rooster_id: walaRooster.id,
      wala_weight: walaRooster.weightGrams / 1000,
      status,
      queue_status: queueStatus,
      created_by: actorId,
    })
    .select('id')
    .single()

  if (matchError) throw matchError

  const betRows = [
    {
      match_id: match.id,
      event_id: eventId,
      side: 'meron',
      amount: meronBet,
      barcode: formatMatchBetBarcode(eventId, fightNumber, 'meron'),
      payment_status: 'unpaid',
      recorded_by: actorId,
    },
    {
      match_id: match.id,
      event_id: eventId,
      side: 'wala',
      amount: walaBet,
      barcode: formatMatchBetBarcode(eventId, fightNumber, 'wala'),
      payment_status: 'unpaid',
      recorded_by: actorId,
    },
  ]

  const { data: bets, error: betsError } = await supabase
    .from('match_bets')
    .insert(betRows)
    .select('id, side, amount, barcode, payment_status')

  if (betsError) throw betsError

  await markSeedRoostersMatched(supabase, [meronRooster.id, walaRooster.id])

  return { matchId: match.id, fightNumber, bets: bets ?? [] }
}

const DEFAULT_MERON_BET = 500
const DEFAULT_WALA_BET = 750

/**
 * Seeds Fight #1 (draft, awaiting pledge) and Fight #2 (scheduled queue).
 * @param {'classic'|'derby'} options.demoKind
 */
export async function seedSampleMatches({
  supabase,
  eventId,
  actorId,
  paidEntries,
  demoKind,
  ledgerBalanceRef,
  tallies,
  paymentSeq = 0,
  meronBet = DEFAULT_MERON_BET,
  walaBet = DEFAULT_WALA_BET,
}) {
  if (paidEntries.length < 2) {
    throw new Error('Seed matches require at least two paid-tier entries.')
  }

  const now = new Date().toISOString()
  let seq = paymentSeq
  const summary = {
    draftMatch: null,
    queuedMatch: null,
  }

  if (demoKind === 'classic') {
    if (paidEntries.length < 4) {
      throw new Error('Classic seed matches require four paid-tier entries.')
    }

    const draft = await insertSeedMatchWithBets(supabase, {
      eventId,
      actorId,
      fightNumber: 1,
      meronEntry: paidEntries[0],
      meronRooster: pickRooster(paidEntries[0], 1),
      walaEntry: paidEntries[1],
      walaRooster: pickRooster(paidEntries[1], 1),
      status: 'draft',
      queueStatus: null,
      meronBet,
      walaBet,
    })

    summary.draftMatch = {
      fightNumber: draft.fightNumber,
      meronBarcode: draft.bets.find((bet) => bet.side === 'meron')?.barcode,
      walaBarcode: draft.bets.find((bet) => bet.side === 'wala')?.barcode,
    }

    const queued = await insertSeedMatchWithBets(supabase, {
      eventId,
      actorId,
      fightNumber: 2,
      meronEntry: paidEntries[2],
      meronRooster: pickRooster(paidEntries[2], 1),
      walaEntry: paidEntries[3],
      walaRooster: pickRooster(paidEntries[3], 1),
      status: 'locked',
      queueStatus: 'scheduled',
      meronBet,
      walaBet,
    })

    for (const bet of queued.bets) {
      const entry = bet.side === 'meron' ? paidEntries[2] : paidEntries[3]
      seq += 1
      await insertSeedMatchBetPayment(supabase, {
        eventId,
        actorId,
        matchId: queued.matchId,
        matchBetId: bet.id,
        entryId: entry.entryId,
        entryName: entry.entryName,
        fightNumber: queued.fightNumber,
        side: bet.side,
        amountDue: Number(bet.amount),
        paymentSeq: seq,
        paidAt: now,
        ledgerBalanceRef,
        tallies,
      })
    }

    summary.queuedMatch = {
      fightNumber: queued.fightNumber,
      meronBarcode: queued.bets.find((bet) => bet.side === 'meron')?.barcode,
      walaBarcode: queued.bets.find((bet) => bet.side === 'wala')?.barcode,
    }
  } else {
    const draft = await insertSeedMatchWithBets(supabase, {
      eventId,
      actorId,
      fightNumber: 1,
      meronEntry: paidEntries[0],
      meronRooster: pickRooster(paidEntries[0], 1),
      walaEntry: paidEntries[1],
      walaRooster: pickRooster(paidEntries[1], 1),
      status: 'draft',
      queueStatus: null,
      meronBet,
      walaBet,
    })

    summary.draftMatch = {
      fightNumber: draft.fightNumber,
      meronBarcode: draft.bets.find((bet) => bet.side === 'meron')?.barcode,
      walaBarcode: draft.bets.find((bet) => bet.side === 'wala')?.barcode,
    }

    const queued = await insertSeedMatchWithBets(supabase, {
      eventId,
      actorId,
      fightNumber: 2,
      meronEntry: paidEntries[0],
      meronRooster: pickRooster(paidEntries[0], 2),
      walaEntry: paidEntries[1],
      walaRooster: pickRooster(paidEntries[1], 2),
      status: 'locked',
      queueStatus: 'scheduled',
      meronBet,
      walaBet,
    })

    for (const bet of queued.bets) {
      const entry = bet.side === 'meron' ? paidEntries[0] : paidEntries[1]
      seq += 1
      await insertSeedMatchBetPayment(supabase, {
        eventId,
        actorId,
        matchId: queued.matchId,
        matchBetId: bet.id,
        entryId: entry.entryId,
        entryName: entry.entryName,
        fightNumber: queued.fightNumber,
        side: bet.side,
        amountDue: Number(bet.amount),
        paymentSeq: seq,
        paidAt: now,
        ledgerBalanceRef,
        tallies,
      })
    }

    summary.queuedMatch = {
      fightNumber: queued.fightNumber,
      meronBarcode: queued.bets.find((bet) => bet.side === 'meron')?.barcode,
      walaBarcode: queued.bets.find((bet) => bet.side === 'wala')?.barcode,
    }
  }

  tallies.revolvingFundFinalBalance = ledgerBalanceRef.current
  tallies.matchSummary = summary

  return summary
}

export async function insertDemoEvent(supabase, { actorId, venue, event }) {
  const today = new Date()
  const eventDate = today.toISOString()
  const revolvingFundInitial = Number(
    Math.max(0, event.revolvingFundInitial ?? 0).toFixed(2)
  )

  const payload = {
    name: event.name,
    venue,
    event_date: eventDate,
    registration_deadline: event.registrationDeadline ?? null,
    event_type: event.eventType,
    derby_format: event.derbyFormat ?? null,
    derby_type: event.derbyAgeType ?? null,
    cocks_per_entry: event.cocksPerEntry,
    status: event.status ?? DEMO_EVENT_STATUS,
    is_active: false,
    entry_fee: event.fees.registrationFeeEnabled ? event.fees.registrationFeeAmount : 0,
    registration_fee_enabled: event.fees.registrationFeeEnabled,
    registration_fee_amount: event.fees.registrationFeeAmount,
    rooster_entry_fee_enabled: event.fees.roosterEntryFeeEnabled,
    rooster_entry_fee_amount: event.fees.roosterEntryFeeAmount,
    cash_bond_enabled: event.fees.cashBondEnabled,
    cash_bond_amount: event.fees.cashBondAmount,
    tax_per_fight: event.taxPerFight ?? (event.eventType === 'classic' ? 50 : 100),
    tax_commission: 0,
    physical_inspection_required: false,
    weight_verification_required: false,
    require_rooster_entry_approval: event.requireRoosterEntryApproval ?? false,
    eligibility_enforcement_enabled: false,
    classification_matching_enabled: false,
    revolving_fund_initial: revolvingFundInitial,
    cashier_opening_float_default: revolvingFundInitial,
    scoring_system: 'points',
    draw_rule: '0.5 points',
    tie_breaker_rule: 'shared_championship',
    legal_authorized: true,
    is_public: false,
    publish_matches: false,
    publish_standings: false,
    publish_winners: false,
    publish_prize_amounts: false,
    notes: event.notes ?? 'Demo seed for cashier + matching practice.',
    created_by: actorId,
    min_weight_grams: 1800,
    max_weight_grams: 2300,
    match_weight_tolerance_grams: 50,
  }

  const { data, error } = await supabase
    .from('events')
    .insert(payload)
    .select('id, name, status')
    .single()
  if (error) throw error

  // Mirror createEvent: always post an opening ledger row (amount may be 0).
  await insertOpeningRevolvingFund(supabase, {
    eventId: data.id,
    actorId,
    amount: revolvingFundInitial,
  })

  return { ...data, revolvingFundInitial }
}

export async function insertPrizeStructure(supabase, eventId, prizeStructure) {
  const { error } = await supabase.from('prize_structures').insert({
    event_id: eventId,
    prize_type: prizeStructure.prizeType,
    config: prizeStructure.config,
  })
  if (error) throw error
}

async function findOrCreateSeedCompetitor(supabase, actorId, ownerName, contact) {
  const displayName = ownerName.trim()
  const { data: existing, error: lookupError } = await supabase
    .from('competitors')
    .select('id')
    .is('deleted_at', null)
    .ilike('display_name', displayName)
    .maybeSingle()

  if (lookupError) throw lookupError
  if (existing?.id) return existing.id

  const { data: created, error: createError } = await supabase
    .from('competitors')
    .insert({
      display_name: displayName,
      contact_full_name: contact.contactFullName,
      contact_number: contact.contactNumber,
      email: contact.email,
      created_by: actorId,
      updated_by: actorId,
    })
    .select('id')
    .single()

  if (createError) throw createError
  return created.id
}

/**
 * @param {object} options
 * @param {import('@supabase/supabase-js').SupabaseClient} options.supabase
 * @param {string} options.eventId
 * @param {string} options.actorId
 * @param {string[]} options.ownerNames
 * @param {number} options.cocksPerEntry
 * @param {object} options.fees
 * @param {boolean} options.includeFeeSnapshot
 * @param {number} options.revolvingFundInitial
 */
export async function seedOwnersEntriesAndRoosters({
  supabase,
  eventId,
  actorId,
  ownerNames,
  cocksPerEntry,
  fees,
  includeFeeSnapshot,
  revolvingFundInitial = 0,
}) {
  const snapshot = includeFeeSnapshot ? feeSnapshotFromSettings(fees) : null
  const now = new Date().toISOString()
  let paymentSeq = 0
  let cockSeq = 0
  const ledgerBalanceRef = {
    current: Number(Math.max(0, revolvingFundInitial).toFixed(2)),
  }

  const tallies = {
    owners: ownerNames.length,
    unpaid: 0,
    partial: 0,
    paid: 0,
    roosters: 0,
    collections: 0,
    collectedAmount: 0,
    revolvingFundFinalBalance: ledgerBalanceRef.current,
  }

  const entries = []

  const colors = ['Red', 'White', 'Grey', 'Black', 'Hennie', 'Lemon', 'Bulik', 'Sweater']
  const baseWeights = [1950, 1980, 2000, 2020, 2050, 2080, 2100, 2120, 2150, 2180]

  for (let i = 0; i < ownerNames.length; i++) {
    const ownerName = ownerNames[i]
    const tier = paymentTierForIndex(i, ownerNames.length)
    tallies[tier] += 1

    const entryNumber = formatEntryNumber(i + 1)
    const ownerBarcode = formatOwnerBarcode(eventId, i + 1)
    const paymentStatus = tier === 'unpaid' ? 'unpaid' : tier === 'partial' ? 'partial' : 'paid'
    const regPaymentStatus = deriveRegPaymentStatus(tier, fees)

    const contactFullName = `${ownerName} Contact`
    const contactNumber = `+63917${String(1000000 + i).slice(0, 7)}`
    const email = `seed-owner-${i + 1}@example.com`
    const competitorId = await findOrCreateSeedCompetitor(supabase, actorId, ownerName, {
      contactFullName,
      contactNumber,
      email,
    })

    const { data: entry, error: entryError } = await supabase
      .from('entries')
      .insert({
        event_id: eventId,
        competitor_id: competitorId,
        entry_number: entryNumber,
        entry_name: ownerName,
        owner_name: ownerName,
        contact_full_name: contactFullName,
        contact_number: contactNumber,
        email,
        entry_source: 'staff_encoded',
        registration_status: 'approved',
        payment_status: paymentStatus,
        owner_barcode: ownerBarcode,
        fee_snapshot: snapshot,
        notes: `Seed ${tier} dues`,
        created_by: actorId,
      })
      .select('id')
      .single()

    if (entryError) throw entryError

    const entryRoosters = []

    for (let cock = 1; cock <= cocksPerEntry; cock++) {
      cockSeq += 1
      const weightGrams = baseWeights[(i + cock) % baseWeights.length] + (cock - 1) * 5
      const cockBarcode = formatCockEntryBarcode(eventId, cockSeq)
      const bandNumber = `SEED-${entryNumber}-${cock}`

      const { data: registration, error: regError } = await supabase
        .from('rooster_event_registrations')
        .insert({
          entry_id: entry.id,
          event_id: eventId,
          cock_entry_barcode: cockBarcode,
          registry_rooster_id: null,
          cock_number: cock,
          band_number: bandNumber,
          declared_weight: weightGrams / 1000,
          declared_weight_grams: weightGrams,
          official_weight_grams: weightGrams,
          color_marking: colors[(i + cock) % colors.length],
          handler_name: null,
          notes: 'Seed matching-ready rooster',
          status: 'verified',
          registration_status: 'approved',
          approval_status: 'approved',
          eligibility_status: 'eligible',
          inspection_status: 'not_required',
          reg_payment_status: regPaymentStatus,
          weight_verified: true,
          weight_verification_status: 'passed',
          weighed_at: now,
          weighed_by: actorId,
          submitted_by: actorId,
          submitted_at: now,
          approved_by: actorId,
          approved_at: now,
        })
        .select('id')
        .single()

      if (regError) throw regError

      const { error: weighError } = await supabase.from('weighings').insert({
        rooster_event_registration_id: registration.id,
        entry_id: entry.id,
        event_id: eventId,
        official_weight: weightGrams / 1000,
        official_weight_grams: weightGrams,
        weight_status: 'passed',
        verified_by: actorId,
        verified_at: now,
        notes: 'Seed verified weight',
      })

      if (weighError) throw weighError
      tallies.roosters += 1

      entryRoosters.push({
        id: registration.id,
        cockNumber: cock,
        barcode: cockBarcode,
        weightGrams,
      })
    }

    entries.push({
      entryId: entry.id,
      entryName: ownerName,
      tier,
      roosters: entryRoosters,
    })

    const roosterCount = cocksPerEntry
    const categories = ['registration', 'rooster_entry', 'cash_bond']

    if (tier === 'partial') {
      const amountDue = computeCategoryDue('registration', fees, roosterCount)
      if (amountDue > 0) {
        paymentSeq += 1
        await insertSeedPaymentWithCollection(supabase, {
          eventId,
          actorId,
          entryId: entry.id,
          entryName: ownerName,
          paymentSeq,
          amountDue,
          paymentCategory: 'registration',
          notes: 'Seed partial (registration only)',
          paidAt: now,
          ledgerBalanceRef,
          tallies,
        })
      }
    } else if (tier === 'paid') {
      for (const category of categories) {
        const amountDue = computeCategoryDue(category, fees, roosterCount)
        if (amountDue <= 0) continue
        paymentSeq += 1
        await insertSeedPaymentWithCollection(supabase, {
          eventId,
          actorId,
          entryId: entry.id,
          entryName: ownerName,
          paymentSeq,
          amountDue,
          paymentCategory: category,
          notes: 'Seed full payment',
          paidAt: now,
          ledgerBalanceRef,
          tallies,
        })
      }
    }
  }

  tallies.revolvingFundFinalBalance = ledgerBalanceRef.current
  return { tallies, entries, ledgerBalanceRef, nextPaymentSeq: paymentSeq }
}

export function printSeedSummary({
  eventId,
  eventName,
  eventStatus,
  tallies,
  kind,
  revolvingFundInitial,
  matchSummary,
}) {
  console.log('')
  console.log(`=== ${kind} demo seed complete ===`)
  console.log(`Event: ${eventName}`)
  console.log(`Id:    ${eventId}`)
  if (eventStatus) {
    console.log(`Status: ${eventStatus} (matching + cashier ready)`)
  }
  console.log(
    `Owners: ${tallies.owners} (unpaid ${tallies.unpaid}, partial ${tallies.partial}, paid ${tallies.paid})`
  )
  console.log(`Roosters: ${tallies.roosters}`)
  if (revolvingFundInitial != null) {
    console.log(`Revolving fund opening: ${revolvingFundInitial}`)
  }
  if (tallies.collections > 0) {
    console.log(
      `Revolving fund collections: ${tallies.collections} (${tallies.collectedAmount} collected)`
    )
  }
  if (tallies.revolvingFundFinalBalance != null) {
    console.log(`Revolving fund balance: ${tallies.revolvingFundFinalBalance}`)
  }
  if (matchSummary?.draftMatch) {
    console.log('')
    console.log('Sample matches:')
    console.log(
      `  Fight #${matchSummary.draftMatch.fightNumber} (draft, awaiting pledge): ` +
        `${matchSummary.draftMatch.meronBarcode}, ${matchSummary.draftMatch.walaBarcode}`
    )
  }
  if (matchSummary?.queuedMatch) {
    console.log(
      `  Fight #${matchSummary.queuedMatch.fightNumber} (scheduled fight queue): ` +
        `${matchSummary.queuedMatch.meronBarcode}, ${matchSummary.queuedMatch.walaBarcode}`
    )
  }
  console.log('')
  console.log('Dashboard:')
  console.log(`  Overview:  /dashboard/events/${eventId}`)
  console.log(`  Cashier:   /dashboard/events/${eventId}/payments`)
  console.log(`  Revolving: /dashboard/events/${eventId}/revolving-fund`)
  console.log(`  Owners:    /dashboard/events/${eventId}/owners`)
  console.log(`  Matching:  /dashboard/events/${eventId}/matching`)
  console.log('')
}
