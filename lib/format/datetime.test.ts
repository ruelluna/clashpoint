import { describe, expect, it } from 'vitest'

import { formatEventDateTime } from '@/lib/format/datetime'

describe('formatEventDateTime', () => {
  it('uses a fixed locale and timezone for stable SSR output', () => {
    const formatted = formatEventDateTime('2026-07-30T12:23:00.000Z')

    expect(formatted).toMatch(/2026/)
    expect(formatted).toMatch(/Jul|30/)
    expect(new Date('2026-07-30T12:23:00.000Z').toLocaleString('en-PH', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZone: 'Asia/Manila',
    })).toBe(formatted)
  })
})
