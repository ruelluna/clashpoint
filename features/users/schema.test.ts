import { describe, expect, it } from 'vitest'

import { inviteUserSchema, updateUserModulesSchema } from '@/features/users/schema'

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
