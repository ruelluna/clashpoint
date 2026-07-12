import { describe, expect, it } from 'vitest'

import {
  inviteUserSchema,
  updateUserModulesSchema,
  updateUserRoleSchema,
} from '@/features/users/schema'

describe('inviteUserSchema', () => {
  it('requires at least one module for staff users', () => {
    const result = inviteUserSchema.safeParse({
      email: 'staff@clashpoint.test',
      password: 'password123',
      role: 'staff',
      modules: [],
    })

    expect(result.success).toBe(false)
  })

  it('accepts staff invite with modules', () => {
    const result = inviteUserSchema.safeParse({
      email: 'staff@clashpoint.test',
      password: 'password123',
      role: 'staff',
      modules: ['rooster-entries'],
    })

    expect(result.success).toBe(true)
  })

  it('does not require modules for event organizers', () => {
    const result = inviteUserSchema.safeParse({
      email: 'organizer@clashpoint.test',
      password: 'password123',
      role: 'event_organizer',
    })

    expect(result.success).toBe(true)
  })

  it('rejects promoter role invites', () => {
    const result = inviteUserSchema.safeParse({
      email: 'promoter@clashpoint.test',
      password: 'password123',
      role: 'promoter',
    })

    expect(result.success).toBe(false)
  })
})

describe('updateUserRoleSchema', () => {
  it('rejects promoter as a target role', () => {
    const result = updateUserRoleSchema.safeParse({
      userId: '00000000-0000-4000-8000-000000000001',
      role: 'promoter',
    })

    expect(result.success).toBe(false)
  })

  it('accepts staff as a target role', () => {
    const result = updateUserRoleSchema.safeParse({
      userId: '00000000-0000-4000-8000-000000000001',
      role: 'staff',
    })

    expect(result.success).toBe(true)
  })
})

describe('updateUserModulesSchema', () => {
  it('requires at least one module', () => {
    const result = updateUserModulesSchema.safeParse({
      userId: '00000000-0000-0000-0000-000000000001',
      modules: [],
    })

    expect(result.success).toBe(false)
  })
})
