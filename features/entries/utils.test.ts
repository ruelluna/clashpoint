import { describe, expect, it } from 'vitest'

import {
  DUPLICATE_ENTRY_ERROR,
  isSameEntryIdentity,
} from '@/features/entries/utils'

describe('duplicate entry identity', () => {
  it('flags duplicate owner and handler pairs', () => {
    const existing = [
      { owner_name: 'Farm Alpha', handler_name: 'Juan' },
      { owner_name: 'Farm Beta', handler_name: null },
    ]

    const duplicate = existing.some((row) =>
      isSameEntryIdentity('farm alpha', 'juan', row.owner_name, row.handler_name)
    )

    expect(duplicate).toBe(true)
  })

  it('allows same owner with different handler', () => {
    const existing = [{ owner_name: 'Farm Alpha', handler_name: 'Juan' }]

    const duplicate = existing.some((row) =>
      isSameEntryIdentity('Farm Alpha', 'Pedro', row.owner_name, row.handler_name)
    )

    expect(duplicate).toBe(false)
  })

  it('uses stable duplicate error copy', () => {
    expect(DUPLICATE_ENTRY_ERROR).toMatch(/owner and handler/i)
  })
})
