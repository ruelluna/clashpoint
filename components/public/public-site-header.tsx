'use client'

import Link from 'next/link'
import {
  Box,
  Container,
  Drawer,
  Flex,
  Icon,
  IconButton,
  Link as ChakraLink,
} from '@chakra-ui/react'
import { MenuIcon } from 'lucide-react'
import { useState } from 'react'

import { useCompactShell } from '@/hooks/use-mobile'

const navLinks = [
  { href: '/events', label: 'Events' },
  { href: '/portal', label: 'Promoter portal' },
  { href: '/login', label: 'Sign in' },
]

export function PublicSiteHeader() {
  const isCompactShell = useCompactShell()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <Box as="header" borderBottomWidth="1px" borderColor="border">
      <Container maxW="6xl" py={4} px={{ base: 4, md: 6 }}>
        <Flex align="center" justify="space-between" gap={4}>
          <ChakraLink asChild fontSize="sm" fontWeight="semibold" letterSpacing="wide">
            <Link href="/">ClashPoint</Link>
          </ChakraLink>

          {isCompactShell ? (
            <>
              <IconButton
                aria-label="Open menu"
                variant="ghost"
                size="md"
                onClick={() => setMenuOpen(true)}
              >
                <Icon asChild boxSize={5}>
                  <MenuIcon />
                </Icon>
              </IconButton>
              <Drawer.Root
                open={menuOpen}
                onOpenChange={(details) => setMenuOpen(details.open)}
                placement="end"
                size="xs"
              >
                <Drawer.Backdrop />
                <Drawer.Positioner>
                  <Drawer.Content>
                    <Drawer.Header borderBottomWidth="1px" borderColor="border">
                      <Drawer.Title fontSize="md">Menu</Drawer.Title>
                    </Drawer.Header>
                    <Drawer.Body py={4}>
                      <Flex as="nav" direction="column" gap={2}>
                        {navLinks.map((item) => (
                          <ChakraLink
                            key={item.href}
                            asChild
                            px={3}
                            py={2}
                            rounded="md"
                            fontSize="sm"
                            color="fg.muted"
                            _hover={{ bg: 'bg.subtle', color: 'fg' }}
                          >
                            <Link href={item.href} onClick={() => setMenuOpen(false)}>
                              {item.label}
                            </Link>
                          </ChakraLink>
                        ))}
                      </Flex>
                    </Drawer.Body>
                  </Drawer.Content>
                </Drawer.Positioner>
              </Drawer.Root>
            </>
          ) : (
            <Flex as="nav" align="center" gap={4} fontSize="sm">
              {navLinks.map((item) => (
                <ChakraLink
                  key={item.href}
                  asChild
                  color="fg.muted"
                  _hover={{ color: 'fg' }}
                >
                  <Link href={item.href}>{item.label}</Link>
                </ChakraLink>
              ))}
            </Flex>
          )}
        </Flex>
      </Container>
    </Box>
  )
}
