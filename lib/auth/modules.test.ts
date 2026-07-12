import { describe, expect, it } from 'vitest'

import {
  ACCESS_MODULES,
  moduleToPermissions,
  modulesToPermissions,
  permissionsToModules,
} from '@/lib/auth/modules'

describe('moduleToPermissions', () => {
  it('expands rooster-entries to entries, weighing, and events view', () => {
    expect(moduleToPermissions('rooster-entries')).toEqual([
      'entries.manage',
      'weighing.manage',
      'events.view',
    ])
  })
})

describe('modulesToPermissions', () => {
  it('deduplicates shared permissions across modules', () => {
    expect(modulesToPermissions(['events', 'rooster-entries'])).toEqual([
      'events.manage',
      'events.view',
      'entries.manage',
      'weighing.manage',
    ])
  })
})

describe('permissionsToModules', () => {
  it('returns modules only when all module permissions are present', () => {
    const modules = permissionsToModules([
      'entries.manage',
      'weighing.manage',
      'events.view',
    ])

    expect(modules).toContain('rooster-entries')
    expect(modules).not.toContain('events')
  })

  it('round-trips selected modules through permission expansion', () => {
    const selected = ['rooster-entries', 'matching'] as const
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
