import { describe, expect, it } from 'vitest'

import {
  ACCESS_MODULES,
  moduleToPermissions,
  modulesToPermissions,
  permissionsToModules,
} from '@/lib/auth/modules'

describe('moduleToPermissions', () => {
  it('expands registrations to entries and events view', () => {
    expect(moduleToPermissions('registrations')).toEqual([
      'entries.manage',
      'events.view',
    ])
  })
})

describe('modulesToPermissions', () => {
  it('deduplicates shared permissions across modules', () => {
    expect(modulesToPermissions(['events', 'registrations'])).toEqual([
      'events.manage',
      'events.view',
      'entries.manage',
    ])
  })
})

describe('permissionsToModules', () => {
  it('returns modules only when all module permissions are present', () => {
    const modules = permissionsToModules([
      'entries.manage',
      'events.view',
      'payments.manage',
    ])

    expect(modules).toContain('registrations')
    expect(modules).toContain('payments')
    expect(modules).not.toContain('events')
  })

  it('round-trips selected modules through permission expansion', () => {
    const selected = ['lineups', 'weighing'] as const
    const roundTrip = permissionsToModules(modulesToPermissions([...selected]))

    expect(roundTrip).toEqual([...selected])
  })
})

describe('ACCESS_MODULES', () => {
  it('defines unique module ids', () => {
    const ids = ACCESS_MODULES.map((mod) => mod.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})
