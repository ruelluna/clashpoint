'use client'

import { Box, Flex, Link as ChakraLink, Text } from '@chakra-ui/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

type PortalShellProps = {
  displayName: string
  children: React.ReactNode
}

const navItems = [
  { href: '/portal', label: 'Dashboard', exact: true },
  { href: '/portal/events', label: 'My events', exact: false },
]

export function PortalShell({ displayName, children }: PortalShellProps) {
  const pathname = usePathname()

  return (
    <Box minH="100vh" bg="bg">
      <Box borderBottomWidth="1px" borderColor="border" bg="bg.panel">
        <Flex
          maxW="6xl"
          mx="auto"
          px={{ base: 4, md: 6 }}
          py={4}
          justify="space-between"
          align={{ base: 'flex-start', sm: 'center' }}
          direction={{ base: 'column', sm: 'row' }}
          gap={4}
        >
          <Box>
            <Text fontWeight="semibold">Promoter portal</Text>
            <Text fontSize="sm" color="fg.muted">
              {displayName}
            </Text>
          </Box>
          <ChakraLink asChild fontSize="sm" color="fg.muted">
            <Link href="/">ClashPoint home</Link>
          </ChakraLink>
        </Flex>
        <Flex maxW="6xl" mx="auto" px={{ base: 4, md: 6 }} pb={3} gap={2} flexWrap="wrap">
          {navItems.map((item) => {
            const active = item.exact
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(`${item.href}/`)

            return (
              <ChakraLink
                key={item.href}
                asChild
                px={3}
                py={2}
                rounded="md"
                fontSize="sm"
                fontWeight={active ? 'semibold' : 'medium'}
                bg={active ? 'bg.subtle' : 'transparent'}
                _hover={{ bg: 'bg.subtle' }}
              >
                <Link href={item.href}>{item.label}</Link>
              </ChakraLink>
            )
          })}
        </Flex>
      </Box>
      <Box maxW="6xl" mx="auto" px={{ base: 4, md: 6 }} py={{ base: 6, md: 8 }}>
        {children}
      </Box>
    </Box>
  )
}
