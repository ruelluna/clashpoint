import { describe, expect, it } from 'vitest'

import {
  activeEventNavHref,
  dashboardNavItemConfigs,
  filterNavItemsByPermissions,
  isDashboardNavItemActive,
  prependActiveEventNavItem,
} from '@/lib/dashboard/nav'

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

  it('shows Owners when staff can view roosters or manage entries', () => {
    const ownersItem = dashboardNavItemConfigs.find(
      (item) => item.href === '/dashboard/owners'
    )

    expect(ownersItem?.label).toBe('Owners')

    expect(
      filterNavItemsByPermissions(dashboardNavItemConfigs, ['rooster.view']).map(
        (item) => item.href
      )
    ).toContain('/dashboard/owners')

    expect(
      filterNavItemsByPermissions(dashboardNavItemConfigs, ['entries.manage']).map(
        (item) => item.href
      )
    ).toContain('/dashboard/owners')
  })

  it('does not expose a global Roosters registry nav item', () => {
    expect(
      dashboardNavItemConfigs.some((item) => item.href === '/dashboard/roosters')
    ).toBe(false)
  })
})

describe('prependActiveEventNavItem', () => {
  const activeEvent = {
    id: '00000000-0000-4000-8000-000000000001',
    name: 'Summer Derby',
  }

  it('prepends the active event before Dashboard when permitted', () => {
    const items = filterNavItemsByPermissions(dashboardNavItemConfigs, [
      'events.view',
    ])
    const withActive = prependActiveEventNavItem(
      items,
      activeEvent,
      ['events.view']
    )

    expect(withActive[0]).toMatchObject({
      label: 'Summer Derby',
      href: activeEventNavHref(activeEvent.id),
      badge: 'Active',
    })
    expect(withActive[1]?.href).toBe('/dashboard')
  })

  it('does not prepend without events permissions', () => {
    const items = filterNavItemsByPermissions(dashboardNavItemConfigs, [
      'audit.view',
    ])
    const withActive = prependActiveEventNavItem(items, activeEvent, [
      'audit.view',
    ])

    expect(withActive.map((item) => item.href)[0]).toBe('/dashboard')
    expect(
      withActive.some((item) => item.href === activeEventNavHref(activeEvent.id))
    ).toBe(false)
  })
})

describe('isDashboardNavItemActive', () => {
  const activeHref = '/dashboard/events/00000000-0000-4000-8000-000000000001'

  it('marks the active event nav when under that event path', () => {
    expect(
      isDashboardNavItemActive(`${activeHref}/matching`, activeHref, activeHref)
    ).toBe(true)
  })

  it('does not mark Events list when viewing the pinned active event', () => {
    expect(
      isDashboardNavItemActive(activeHref, '/dashboard/events', activeHref)
    ).toBe(false)
  })

  it('marks Events list on the events index', () => {
    expect(
      isDashboardNavItemActive('/dashboard/events', '/dashboard/events', activeHref)
    ).toBe(true)
  })
})
