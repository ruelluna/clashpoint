'use client'

import { Box, Flex, Link as ChakraLink, Text } from '@chakra-ui/react'
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

      <Box overflowX="auto" borderBottomWidth="1px" borderColor="border">
        <Flex gap={1} minW="max-content" pb={1}>
          {visibleTabs.map((tab) => {
            const href = tab.slug ? `${basePath}/${tab.slug}` : basePath
            const isActive = tab.slug
              ? pathname === href || pathname.startsWith(`${href}/`)
              : pathname === basePath

            return (
              <ChakraLink
                key={tab.slug || 'overview'}
                asChild
                px={3}
                py={2}
                rounded="md"
                fontSize="sm"
                fontWeight={isActive ? 'semibold' : 'medium'}
                color={isActive ? 'fg' : 'fg.muted'}
                bg={isActive ? 'bg.subtle' : 'transparent'}
                whiteSpace="nowrap"
                _hover={{ bg: 'bg.subtle', color: 'fg' }}
              >
                <Link href={href}>{tab.label}</Link>
              </ChakraLink>
            )
          })}
        </Flex>
      </Box>
    </Flex>
  )
}
