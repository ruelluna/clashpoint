'use client'

import { Box, Flex, Link as ChakraLink, Text } from '@chakra-ui/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const EVENT_TABS = [
  { slug: '', label: 'Overview' },
  { slug: 'registrations', label: 'Registrations' },
  { slug: 'payments', label: 'Payments' },
  { slug: 'lineups', label: 'Lineups' },
  { slug: 'weighing', label: 'Weighing' },
  { slug: 'matching', label: 'Matching' },
  { slug: 'fight-queue', label: 'Fight Queue' },
  { slug: 'results', label: 'Results' },
  { slug: 'standings', label: 'Standings' },
  { slug: 'winners', label: 'Winners' },
  { slug: 'payouts', label: 'Payouts' },
  { slug: 'promoter-settlement', label: 'Promoter Settlement' },
  { slug: 'announcement', label: 'Announcement' },
  { slug: 'reports', label: 'Reports' },
] as const

type EventDetailTabsProps = {
  eventId: string
  eventName: string
}

export function EventDetailTabs({ eventId, eventName }: EventDetailTabsProps) {
  const pathname = usePathname()
  const basePath = `/dashboard/events/${eventId}`

  return (
    <Box className="space-y-4">
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
          {EVENT_TABS.map((tab) => {
            const href = tab.slug ? `${basePath}/${tab.slug}` : basePath
            const isActive = pathname === href

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
    </Box>
  )
}
