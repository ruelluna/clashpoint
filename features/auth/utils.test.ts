import { describe, expect, it } from 'vitest'

import { safeRedirectPath } from '@/features/auth/utils'

describe('safeRedirectPath', () => {
  it('returns dashboard for missing path', () => {
    expect(safeRedirectPath(undefined)).toBe('/dashboard')
    expect(safeRedirectPath(null)).toBe('/dashboard')
    expect(safeRedirectPath('')).toBe('/dashboard')
  })

  it('blocks open redirects', () => {
    expect(safeRedirectPath('//evil.example')).toBe('/dashboard')
    expect(safeRedirectPath('https://evil.example')).toBe('/dashboard')
  })

  it('allows same-origin relative paths', () => {
    expect(safeRedirectPath('/dashboard/settings')).toBe('/dashboard/settings')
    expect(safeRedirectPath('/login')).toBe('/login')
  })
})
