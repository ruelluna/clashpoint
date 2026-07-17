'use client'

import { Box, Flex, Link as ChakraLink, Tabs, Text } from '@chakra-ui/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export type EventTabItem = {
  slug: string
  label: string
}

const DEFAULT_TABS: EventTabItem[] = [
  { slug: '', label: 'Overview' },
  { slug: 'owners', label: 'Owners' },
  { slug: 'roosters', label: 'Roosters' },
  { slug: 'inspection', label: 'Inspection' },
  { slug: 'payments', label: 'Payments' },
  { slug: 'matching', label: 'Matching' },
  { slug: 'results', label: 'Results' },
  { slug: 'standings', label: 'Standings' },
  { slug: 'winners', label: 'Winners' },
  { slug: 'payouts', label: 'Payouts' },
  { slug: 'promoter-settlement', label: 'Promoter Settlement' },
  { slug: 'announcement', label: 'Announcement' },
  { slug: 'reports', label: 'Reports' },
]

function tabValue(slug: string) {
  return slug || 'overview'
}

function resolveActiveTabValue(
  pathname: string,
  basePath: string,
  visibleTabs: EventTabItem[]
): string {
  const sorted = [...visibleTabs].sort((a, b) => b.slug.length - a.slug.length)

  for (const tab of sorted) {
    if (!tab.slug) {
      if (pathname === basePath) return tabValue(tab.slug)
      continue
    }

    const href = `${basePath}/${tab.slug}`
    if (pathname === href || pathname.startsWith(`${href}/`)) {
      return tabValue(tab.slug)
    }
  }

  return tabValue(visibleTabs[0]?.slug ?? '')
}

type EventDetailTabsProps = {
  eventId: string
  eventName: string
  visibleTabs?: EventTabItem[]
}

export function EventDetailTabs({
  eventId,
  eventName,
  visibleTabs = DEFAULT_TABS,
}: EventDetailTabsProps) {
  const pathname = usePathname()
  const basePath = `/dashboard/events/${eventId}`
  const activeValue = resolveActiveTabValue(pathname, basePath, visibleTabs)

  return (
    <Flex direction="column" gap={4}>
      <Box>
        <Text fontSize="2xl" fontWeight="semibold">
          {eventName}
        </Text>
        <ChakraLink asChild fontSize="sm" color="fg.muted">
          <Link href="/dashboard/events">← Back to events</Link>
        </ChakraLink>
      </Box>

      <Tabs.Root value={activeValue} variant="outline" size="sm">
        <Box overflowX="auto">
          <Tabs.List minW="max-content" borderBottomWidth="1px" borderColor="border">
            {visibleTabs.map((tab) => {
              const href = tab.slug ? `${basePath}/${tab.slug}` : basePath

              return (
                <Tabs.Trigger key={tabValue(tab.slug)} value={tabValue(tab.slug)} asChild>
                  <Link href={href}>{tab.label}</Link>
                </Tabs.Trigger>
              )
            })}
          </Tabs.List>
        </Box>
      </Tabs.Root>
    </Flex>
  )
}
