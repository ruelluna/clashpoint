import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

const mockRpc = vi.fn()
const mockCreateUser = vi.fn()

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(() => ({
    rpc: mockRpc,
    auth: {
      admin: {
        createUser: mockCreateUser,
      },
    },
  })),
}))

import { createFirstAdminUser } from '@/features/auth/service'

describe('createFirstAdminUser', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'test-service-role-key')
    mockRpc.mockResolvedValue({ data: true, error: null })
  })

  it('rejects when a system owner already exists', async () => {
    mockRpc.mockResolvedValue({ data: false, error: null })

    const result = await createFirstAdminUser({
      email: 'admin@example.com',
      password: 'secret1',
      confirmPassword: 'secret1',
    })

    expect(result).toEqual({
      error: 'An admin account already exists. Sign in instead.',
    })
    expect(mockCreateUser).not.toHaveBeenCalled()
  })

  it('returns a setup error when bootstrap state cannot be verified', async () => {
    mockRpc.mockResolvedValue({
      data: null,
      error: { message: 'Invalid API key' },
    })

    const result = await createFirstAdminUser({
      email: 'admin@example.com',
      password: 'secret1',
      confirmPassword: 'secret1',
    })

    expect(result.error).toContain('Unable to verify setup state')
    expect(mockCreateUser).not.toHaveBeenCalled()
  })

  it('creates the first admin when bootstrap is required', async () => {
    mockCreateUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    })

    const result = await createFirstAdminUser({
      email: 'admin@example.com',
      password: 'secret1',
      confirmPassword: 'secret1',
    })

    expect(result).toEqual({ userId: 'user-123' })
    expect(mockCreateUser).toHaveBeenCalledWith({
      email: 'admin@example.com',
      password: 'secret1',
      email_confirm: true,
      user_metadata: undefined,
    })
  })

  it('passes display name metadata when provided', async () => {
    mockCreateUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    })

    await createFirstAdminUser({
      email: 'admin@example.com',
      password: 'secret1',
      confirmPassword: 'secret1',
      displayName: 'Site Admin',
    })

    expect(mockCreateUser).toHaveBeenCalledWith({
      email: 'admin@example.com',
      password: 'secret1',
      email_confirm: true,
      user_metadata: { display_name: 'Site Admin' },
    })
  })

  it('returns cleanup guidance when the email already exists in auth', async () => {
    mockCreateUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'A user with this email address has already been registered' },
    })

    const result = await createFirstAdminUser({
      email: 'admin@example.com',
      password: 'secret1',
      confirmPassword: 'secret1',
    })

    expect(result.error).toContain('already in Supabase Auth')
  })
})
