import { Box, Container } from '@chakra-ui/react'

import { PublicSiteHeader } from '@/components/public/public-site-header'

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Box minH="100vh" bg="bg">
      <PublicSiteHeader />
      <Container as="main" maxW="6xl" py={{ base: 6, md: 8 }} px={{ base: 4, md: 6 }}>
        {children}
      </Container>
    </Box>
  )
}
