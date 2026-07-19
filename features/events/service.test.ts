import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

const { writeAuditLog, createClient } = vi.hoisted(() => ({
  writeAuditLog: vi.fn(),
  createClient: vi.fn(),
}))

vi.mock('@/features/audit/service', () => ({
  writeAuditLog,
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient,
}))

import {
  clearEventActive,
  setEventActive,
  transitionStatus,
} from '@/features/events/service'

const actorId = '00000000-0000-4000-8000-000000000099'
const eventId = '00000000-0000-4000-8000-000000000001'
const peerId = '00000000-0000-4000-8000-000000000002'

describe('setEventActive', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    writeAuditLog.mockResolvedValue({})
  })

  it('rejects when another event is already active', async () => {
    const update = vi.fn()
    createClient.mockResolvedValue({
      from: vi.fn(() => ({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            is: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: {
                  id: eventId,
                  name: 'Target Derby',
                  status: 'open',
                  is_active: false,
                },
                error: null,
              }),
              neq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: { id: peerId, name: 'Peer Derby' },
                  error: null,
                }),
              }),
            }),
          }),
        }),
        update,
      })),
    })

    const result = await setEventActive(actorId, { eventId })

    expect(result.error).toMatch(/already active/i)
    expect(result.error).toMatch(/Peer Derby/)
    expect(update).not.toHaveBeenCalled()
  })

  it('rejects archived events', async () => {
    createClient.mockResolvedValue({
      from: vi.fn(() => ({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            is: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: {
                  id: eventId,
                  name: 'Old Derby',
                  status: 'archived',
                  is_active: false,
                },
                error: null,
              }),
            }),
          }),
        }),
      })),
    })

    const result = await setEventActive(actorId, { eventId })
    expect(result.error).toMatch(/archived/i)
  })

  it('activates when no peer is active', async () => {
    const updateEq = vi.fn().mockReturnValue({
      is: vi.fn().mockResolvedValue({ error: null }),
    })
    const update = vi.fn().mockReturnValue({ eq: updateEq })

    createClient.mockResolvedValue({
      from: vi.fn(() => ({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            is: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: {
                  id: eventId,
                  name: 'Target Derby',
                  status: 'open',
                  is_active: false,
                },
                error: null,
              }),
              neq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: null,
                  error: null,
                }),
              }),
            }),
          }),
        }),
        update,
      })),
    })

    const result = await setEventActive(actorId, { eventId })

    expect(result.error).toBeUndefined()
    expect(update).toHaveBeenCalledWith({ is_active: true })
    expect(writeAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'event.activated' })
    )
  })
})

describe('clearEventActive', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    writeAuditLog.mockResolvedValue({})
  })

  it('clears the active flag and audits', async () => {
    const updateEq = vi.fn().mockResolvedValue({ error: null })
    const update = vi.fn().mockReturnValue({ eq: updateEq })

    createClient.mockResolvedValue({
      from: vi.fn(() => ({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            is: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: {
                  id: eventId,
                  name: 'Target Derby',
                  is_active: true,
                },
                error: null,
              }),
            }),
          }),
        }),
        update,
      })),
    })

    const result = await clearEventActive(actorId, { eventId })

    expect(result.error).toBeUndefined()
    expect(update).toHaveBeenCalledWith({ is_active: false })
    expect(writeAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'event.deactivated' })
    )
  })
})

describe('transitionStatus auto-clear active', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    writeAuditLog.mockResolvedValue({})
  })

  it('clears is_active when moving to completed', async () => {
    const updateEq = vi.fn().mockResolvedValue({ error: null })
    const update = vi.fn().mockReturnValue({ eq: updateEq })

    createClient.mockResolvedValue({
      from: vi.fn(() => ({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            is: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: {
                  status: 'in_progress',
                  name: 'Fight Day',
                  is_active: true,
                },
                error: null,
              }),
            }),
          }),
        }),
        update,
      })),
    })

    const result = await transitionStatus(actorId, {
      eventId,
      status: 'completed',
    })

    expect(result.error).toBeUndefined()
    expect(update).toHaveBeenCalledWith({
      status: 'completed',
      is_active: false,
    })
    expect(writeAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'event.deactivated' })
    )
  })

  it('clears is_active when moving to cancelled', async () => {
    const updateEq = vi.fn().mockResolvedValue({ error: null })
    const update = vi.fn().mockReturnValue({ eq: updateEq })

    createClient.mockResolvedValue({
      from: vi.fn(() => ({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            is: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: {
                  status: 'open',
                  name: 'Cancelled Derby',
                  is_active: true,
                },
                error: null,
              }),
            }),
          }),
        }),
        update,
      })),
    })

    const result = await transitionStatus(actorId, {
      eventId,
      status: 'cancelled',
    })

    expect(result.error).toBeUndefined()
    expect(update).toHaveBeenCalledWith({
      status: 'cancelled',
      is_active: false,
    })
  })
})
