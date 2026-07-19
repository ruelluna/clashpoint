/**
 * Shared helpers for classic/derby demo seed scripts.
 * Uses service role — never import into the Next.js app.
 */

import fs from 'node:fs'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'

export function loadEnvFiles() {
  for (const relativePath of ['.env.local', '.env']) {
    const filePath = path.join(process.cwd(), relativePath)
    if (!fs.existsSync(filePath)) continue

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
      if (!(key in process.env)) {
        process.env[key] = value
      }
    }
  }
}

export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRoleKey) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Add them to .env.local.'
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

export async function resolveSeedActor(supabase) {
  const email = process.env.SEED_FIRST_ADMIN_EMAIL ?? 'ruelluna@gmail.com'
  const user = await findUserByEmail(supabase, email)
  if (!user) {
    throw new Error(
      `No auth user for ${email}. Run npm run seed:first-admin first.`
    )
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, display_name, role')
    .eq('id', user.id)
    .maybeSingle()

  if (error) throw error
  if (!profile) {
    throw new Error(`Profile missing for ${email} (${user.id}).`)
  }

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

export async function insertDemoEvent(supabase, { actorId, venue, event }) {
  const today = new Date()
  const eventDate = today.toISOString()

  const payload = {
    name: event.name,
    venue,
    event_date: eventDate,
    registration_deadline: event.registrationDeadline ?? null,
    event_type: event.eventType,
    derby_format: event.derbyFormat ?? null,
    derby_type: event.derbyAgeType ?? null,
    cocks_per_entry: event.cocksPerEntry,
    status: 'ready_for_matching',
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
    revolving_fund_initial: event.revolvingFundInitial ?? 0,
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

  const { data, error } = await supabase.from('events').insert(payload).select('id, name').single()
  if (error) throw error
  return data
}

export async function insertPrizeStructure(supabase, eventId, prizeStructure) {
  const { error } = await supabase.from('prize_structures').insert({
    event_id: eventId,
    prize_type: prizeStructure.prizeType,
    config: prizeStructure.config,
  })
  if (error) throw error
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
 */
export async function seedOwnersEntriesAndRoosters({
  supabase,
  eventId,
  actorId,
  ownerNames,
  cocksPerEntry,
  fees,
  includeFeeSnapshot,
}) {
  const snapshot = includeFeeSnapshot ? feeSnapshotFromSettings(fees) : null
  const now = new Date().toISOString()
  let paymentSeq = 0
  let cockSeq = 0

  const tallies = {
    owners: ownerNames.length,
    unpaid: 0,
    partial: 0,
    paid: 0,
    roosters: 0,
  }

  const colors = ['Red', 'White', 'Grey', 'Black', 'Hennie', 'Lemon', 'Bulik', 'Sweater']
  const baseWeights = [1950, 1980, 2000, 2020, 2050, 2080, 2100, 2120, 2150, 2180]

  for (let i = 0; i < ownerNames.length; i++) {
    const ownerName = ownerNames[i]
    const tier = paymentTierForIndex(i, ownerNames.length)
    tallies[tier] += 1

    const entryNumber = formatEntryNumber(i + 1)
    const ownerBarcode = formatOwnerBarcode(eventId, i + 1)
    const paymentStatus = tier === 'unpaid' ? 'unpaid' : tier === 'partial' ? 'partial' : 'paid'
    const regPaymentStatus =
      !fees.roosterEntryFeeEnabled
        ? 'not_required'
        : tier === 'paid'
          ? 'paid'
          : 'unpaid'

    const { data: entry, error: entryError } = await supabase
      .from('entries')
      .insert({
        event_id: eventId,
        entry_number: entryNumber,
        entry_name: ownerName,
        owner_name: ownerName,
        contact_full_name: `${ownerName} Contact`,
        contact_number: `+63917${String(1000000 + i).slice(0, 7)}`,
        email: `seed-owner-${i + 1}@example.com`,
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
    }

    const roosterCount = cocksPerEntry
    const categories = ['registration', 'rooster_entry', 'cash_bond']

    if (tier === 'partial') {
      const amountDue = computeCategoryDue('registration', fees, roosterCount)
      if (amountDue > 0) {
        paymentSeq += 1
        const { error: payError } = await supabase.from('payments').insert({
          payment_reference: formatPaymentReference(eventId, paymentSeq),
          entry_id: entry.id,
          event_id: eventId,
          amount_due: amountDue,
          amount_paid: amountDue,
          balance: 0,
          payment_method: 'cash',
          payment_status: 'paid',
          payment_category: 'registration',
          received_by: actorId,
          paid_at: now,
          notes: 'Seed partial (registration only)',
        })
        if (payError) throw payError
      }
    } else if (tier === 'paid') {
      for (const category of categories) {
        const amountDue = computeCategoryDue(category, fees, roosterCount)
        if (amountDue <= 0) continue
        paymentSeq += 1
        const { error: payError } = await supabase.from('payments').insert({
          payment_reference: formatPaymentReference(eventId, paymentSeq),
          entry_id: entry.id,
          event_id: eventId,
          amount_due: amountDue,
          amount_paid: amountDue,
          balance: 0,
          payment_method: 'cash',
          payment_status: 'paid',
          payment_category: category,
          received_by: actorId,
          paid_at: now,
          notes: 'Seed full payment',
        })
        if (payError) throw payError
      }
    }
  }

  return tallies
}

export function printSeedSummary({ eventId, eventName, tallies, kind }) {
  console.log('')
  console.log(`=== ${kind} demo seed complete ===`)
  console.log(`Event: ${eventName}`)
  console.log(`Id:    ${eventId}`)
  console.log(
    `Owners: ${tallies.owners} (unpaid ${tallies.unpaid}, partial ${tallies.partial}, paid ${tallies.paid})`
  )
  console.log(`Roosters: ${tallies.roosters}`)
  console.log('')
  console.log('Dashboard:')
  console.log(`  Overview:  /dashboard/events/${eventId}`)
  console.log(`  Cashier:   /dashboard/events/${eventId}/payments`)
  console.log(`  Owners:    /dashboard/events/${eventId}/owners`)
  console.log(`  Matching:  /dashboard/events/${eventId}/matching`)
  console.log('')
}
