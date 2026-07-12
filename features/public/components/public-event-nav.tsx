'use client'

import { Box, Flex, Link as ChakraLink, Stack, Text } from '@chakra-ui/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import type { PublicEvent } from '@/features/public/types'

type PublicEventNavProps = {
  event: PublicEvent
}

const tabs = [
  { slug: '', label: 'Overview', suffix: '' },
  { slug: 'matches', label: 'Matches', flag: 'publish_matches' as const },
  { slug: 'standings', label: 'Standings', flag: 'publish_standings' as const },
  { slug: 'winners', label: 'Winners', flag: 'publish_winners' as const },
]

export function PublicEventNav({ event }: PublicEventNavProps) {
  const pathname = usePathname()
  const base = `/events/${event.id}`

  return (
    <Stack gap={4}>
      <Box>
        <ChakraLink asChild fontSize="sm" color="fg.muted">
          <Link href="/events">← All events</Link>
        </ChakraLink>
        <Text fontSize="2xl" fontWeight="semibold" mt={2}>
          {event.name}
        </Text>
        <Text color="fg.muted">{event.venue}</Text>
      </Box>

      <Flex gap={2} flexWrap="wrap" borderBottomWidth="1px" borderColor="border" pb={2}>
        {tabs.map((tab) => {
          if (tab.flag && !event[tab.flag]) return null
          const href = tab.slug ? `${base}/${tab.slug}` : base
          const active =
            tab.slug === ''
              ? pathname === base
              : pathname === href || pathname.startsWith(`${href}/`)

          return (
            <ChakraLink
              key={tab.label}
              asChild
              px={3}
              py={2}
              rounded="md"
              fontSize="sm"
              fontWeight={active ? 'semibold' : 'medium'}
              bg={active ? 'bg.subtle' : 'transparent'}
              _hover={{ bg: 'bg.subtle' }}
            >
              <Link href={href}>{tab.label}</Link>
            </ChakraLink>
          )
        })}
      </Flex>
    </Stack>
  )
}
