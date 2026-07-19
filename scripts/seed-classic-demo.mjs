/**
 * Demo seed: classic event with owners + roosters for cashier and matching practice.
 * Run: npm run seed:classic-demo
 *
 * Replaces any event named identically, then makes this event the sole active event.
 */

import {
  activateSeedEvent,
  createServiceClient,
  deleteSeedEventsByName,
  insertDemoEvent,
  loadEnvFiles,
  printSeedSummary,
  resolveSeedActor,
  resolveVenue,
  seedOwnersEntriesAndRoosters,
} from './lib/seed-demo-shared.mjs'

const EVENT_NAME = '[SEED] Classic Cashier Matching'

const OWNER_NAMES = [
  'Sunrise Gamefarm',
  'Valley Pride Farm',
  'Redcrest Ranch',
  'Golden Spur',
  'Northwind Cocks',
  'Laguna Bloodline',
  'Eagle Nest Farm',
  'Silver Talon',
  'Crown Point Yard',
  'Blue Mountain Farm',
  'Harbor View Cocks',
  'Iron Heel Ranch',
  'Cedar Grove Farm',
  'Pacific Edge',
  'Highland Spurs',
  'Riverbend Yard',
]

const FEES = {
  registrationFeeEnabled: true,
  registrationFeeAmount: 500,
  roosterEntryFeeEnabled: true,
  roosterEntryFeeAmount: 300,
  cashBondEnabled: false,
  cashBondAmount: 0,
}

async function main() {
  loadEnvFiles()
  const supabase = createServiceClient()
  const actor = await resolveSeedActor(supabase)
  const venue = await resolveVenue(supabase)

  console.log(`Seeding classic demo as ${actor.email}…`)

  await deleteSeedEventsByName(supabase, EVENT_NAME)

  const event = await insertDemoEvent(supabase, {
    actorId: actor.userId,
    venue,
    event: {
      name: EVENT_NAME,
      eventType: 'classic',
      derbyFormat: null,
      derbyAgeType: null,
      cocksPerEntry: 1,
      fees: FEES,
      taxPerFight: 50,
      requireRoosterEntryApproval: false,
      notes: 'Classic demo seed — cashier + matching practice.',
    },
  })

  const tallies = await seedOwnersEntriesAndRoosters({
    supabase,
    eventId: event.id,
    actorId: actor.userId,
    ownerNames: OWNER_NAMES,
    cocksPerEntry: 1,
    fees: FEES,
    includeFeeSnapshot: false,
  })

  await activateSeedEvent(supabase, event.id)
  printSeedSummary({
    eventId: event.id,
    eventName: EVENT_NAME,
    tallies,
    kind: 'Classic',
  })
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
