/**
 * Demo seed: 3-cock derby event with owners + roosters for cashier and matching practice.
 * Run: npm run seed:derby-demo
 *
 * Replaces any event named identically, then makes this event the sole active event.
 */

import {
  activateSeedEvent,
  createServiceClient,
  deleteSeedEventsByName,
  insertDemoEvent,
  insertPrizeStructure,
  loadEnvFiles,
  printSeedSummary,
  resolveSeedActor,
  resolveVenue,
  seedOwnersEntriesAndRoosters,
} from './lib/seed-demo-shared.mjs'

const EVENT_NAME = '[SEED] Derby Cashier Matching'

const OWNER_NAMES = [
  'Monton Alpha',
  'Monton Bravo',
  'Monton Charlie',
  'Monton Delta',
  'Monton Echo',
  'Monton Foxtrot',
  'Monton Golf',
  'Monton Hotel',
  'Monton India',
  'Monton Juliet',
]

const FEES = {
  registrationFeeEnabled: true,
  registrationFeeAmount: 1000,
  roosterEntryFeeEnabled: true,
  roosterEntryFeeAmount: 500,
  cashBondEnabled: true,
  cashBondAmount: 2000,
}

async function main() {
  loadEnvFiles()
  const supabase = createServiceClient()
  const actor = await resolveSeedActor(supabase)
  const venue = await resolveVenue(supabase)

  console.log(`Seeding derby demo as ${actor.email}…`)

  await deleteSeedEventsByName(supabase, EVENT_NAME)

  const deadline = new Date()
  deadline.setDate(deadline.getDate() + 7)

  const event = await insertDemoEvent(supabase, {
    actorId: actor.userId,
    venue,
    event: {
      name: EVENT_NAME,
      eventType: 'derby',
      derbyFormat: '3_cock',
      derbyAgeType: 'open_derby',
      cocksPerEntry: 3,
      registrationDeadline: deadline.toISOString(),
      fees: FEES,
      taxPerFight: 100,
      requireRoosterEntryApproval: true,
      notes: 'Derby demo seed — cashier + matching practice.',
    },
  })

  await insertPrizeStructure(supabase, event.id, {
    prizeType: 'fixed',
    config: [
      { place: 1, label: 'Champion', value: 100000 },
      { place: 2, label: 'Runner-up', value: 50000 },
    ],
  })

  const tallies = await seedOwnersEntriesAndRoosters({
    supabase,
    eventId: event.id,
    actorId: actor.userId,
    ownerNames: OWNER_NAMES,
    cocksPerEntry: 3,
    fees: FEES,
    includeFeeSnapshot: true,
  })

  await activateSeedEvent(supabase, event.id)
  printSeedSummary({
    eventId: event.id,
    eventName: EVENT_NAME,
    tallies,
    kind: 'Derby',
  })
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
