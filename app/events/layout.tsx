import { Box, Container, Flex, Link as ChakraLink } from '@chakra-ui/react'
import Link from 'next/link'

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Box minH="100vh" bg="bg">
      <Box as="header" borderBottomWidth="1px" borderColor="border">
        <Container maxW="6xl" py={4} px={6}>
          <Flex align="center" justify="space-between">
            <ChakraLink asChild fontSize="sm" fontWeight="semibold" letterSpacing="wide">
              <Link href="/">ClashPoint</Link>
            </ChakraLink>
            <Flex as="nav" align="center" gap={4} fontSize="sm">
              <ChakraLink asChild color="fg.muted" _hover={{ color: 'fg' }}>
                <Link href="/events">Events</Link>
              </ChakraLink>
              <ChakraLink asChild color="fg.muted" _hover={{ color: 'fg' }}>
                <Link href="/portal">Promoter portal</Link>
              </ChakraLink>
              <ChakraLink asChild color="fg.muted" _hover={{ color: 'fg' }}>
                <Link href="/login">Sign in</Link>
              </ChakraLink>
            </Flex>
          </Flex>
        </Container>
      </Box>
      <Container as="main" maxW="6xl" py={8} px={6}>
        {children}
      </Container>
    </Box>
  )
}
