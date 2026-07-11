import { describe, expect, it } from 'vitest'

import { filterNavItemsByPermissions } from '@/lib/dashboard/nav'

describe('filterNavItemsByPermissions', () => {
  const items = [
    { label: 'Dashboard', href: '/dashboard' },
    {
      label: 'Users',
      href: '/dashboard/users',
      requiredPermissions: ['users.manage'],
    },
    {
      label: 'Events',
      href: '/dashboard/events',
      requiredPermissions: ['events.view', 'events.manage'],
    },
  ]

  it('keeps dashboard without required permissions', () => {
    const filtered = filterNavItemsByPermissions(items, ['entries.manage'])
    expect(filtered.map((item) => item.href)).toEqual(['/dashboard'])
  })

  it('shows items when any required permission matches', () => {
    const filtered = filterNavItemsByPermissions(items, ['events.view'])
    expect(filtered.map((item) => item.href)).toEqual([
      '/dashboard',
      '/dashboard/events',
    ])
  })

  it('shows all items for owners', () => {
    const filtered = filterNavItemsByPermissions(items, ['*'])
    expect(filtered).toHaveLength(3)
  })
})
