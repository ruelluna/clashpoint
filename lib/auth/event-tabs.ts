import 'server-only'

import { hasAnyPermission } from '@/lib/auth/permissions'

export const EVENT_TAB_DEFINITIONS = [
  { slug: '', label: 'Overview', permissions: ['events.view'] },
  {
    slug: 'owners',
    label: 'Owners',
    permissions: ['owner_registration.manage', 'entries.manage'],
  },
  {
    slug: 'roosters',
    label: 'Roosters',
    permissions: ['cock_entry.manage', 'entries.manage'],
  },
  {
    slug: 'inspection',
    label: 'Inspection',
    permissions: ['inspection.record', 'weighing.verify', 'entries.manage'],
  },
  {
    slug: 'payments',
    label: 'Payments',
    permissions: ['payments.manage'],
  },
  {
    slug: 'revolving-fund',
    label: 'Revolving fund',
    permissions: ['payments.manage', 'events.manage'],
  },
  { slug: 'matching', label: 'Matching', permissions: ['matches.manage', 'events.view'] },
  { slug: 'results', label: 'Results', permissions: ['results.manage', 'events.view'] },
  { slug: 'standings', label: 'Standings', permissions: ['standings.view', 'events.view'] },
  { slug: 'winners', label: 'Winners', permissions: ['winners.manage', 'events.view'] },
  { slug: 'payouts', label: 'Payouts', permissions: ['payouts.manage', 'events.view'] },
  {
    slug: 'promoter-settlement',
    label: 'Promoter Settlement',
    permissions: ['settlements.manage', 'events.view'],
  },
  { slug: 'announcement', label: 'Announcement', permissions: ['events.view'] },
  { slug: 'reports', label: 'Reports', permissions: ['reports.view', 'events.view'] },
] as const

export type EventTabSlug = (typeof EVENT_TAB_DEFINITIONS)[number]['slug']

export async function getVisibleEventTabs(userId: string) {
  const tabs = []

  for (const tab of EVENT_TAB_DEFINITIONS) {
    const allowed = await hasAnyPermission(userId, [...tab.permissions])
    if (allowed) tabs.push({ slug: tab.slug, label: tab.label })
  }

  return tabs
}
