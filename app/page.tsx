import {
  Box,
  Container,
  Flex,
  Grid,
  Heading,
  Link as ChakraLink,
  Stack,
  Text,
} from '@chakra-ui/react'
import Link from 'next/link'

function getSupabaseEnvStatus() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    return { configured: false as const, connected: false as const }
  }

  return { configured: true as const, url }
}

export default function Home() {
  const envStatus = getSupabaseEnvStatus()

  return (
    <Flex flex="1" direction="column" align="center" justify="center" px={6} py={24}>
      <Container as="main" maxW="lg">
        <Stack gap={8} textAlign="center">
          <Stack gap={3}>
            <Text
              fontSize="sm"
              fontWeight="medium"
              textTransform="uppercase"
              letterSpacing="wide"
              color="fg.muted"
            >
              ClashPoint
            </Text>
            <Heading size="2xl" fontWeight="semibold">
              Event fights, scoring, and leaderboards
            </Heading>
            <Text color="fg.muted">
              Next.js App Router with Supabase SSR is ready for local development.
            </Text>
          </Stack>

          <Flex wrap="wrap" align="center" justify="center" gap={3}>
            <ChakraLink
              asChild
              display="inline-flex"
              alignItems="center"
              rounded="lg"
              borderWidth="1px"
              borderColor="border"
              bg="bg"
              px={4}
              py={2}
              fontSize="sm"
              fontWeight="medium"
              _hover={{ bg: 'bg.subtle' }}
            >
              <Link href="/events">Browse public events</Link>
            </ChakraLink>
            <ChakraLink
              asChild
              display="inline-flex"
              alignItems="center"
              rounded="lg"
              borderWidth="1px"
              borderColor="border"
              bg="bg"
              px={4}
              py={2}
              fontSize="sm"
              fontWeight="medium"
              _hover={{ bg: 'bg.subtle' }}
            >
              <Link href="/portal">Promoter portal</Link>
            </ChakraLink>
          </Flex>

          <Box
            as="dl"
            rounded="xl"
            borderWidth="1px"
            borderColor="border"
            bg="bg"
            p={6}
            textAlign="left"
            fontSize="sm"
          >
            <Grid gap={4}>
              <Flex align="center" justify="space-between" gap={4}>
                <Box as="dt" color="fg.muted">
                  Supabase env
                </Box>
                <Box as="dd" fontWeight="medium">
                  {envStatus.configured ? 'Configured' : 'Missing'}
                </Box>
              </Flex>
              {envStatus.configured ? (
                <Flex align="center" justify="space-between" gap={4}>
                  <Box as="dt" color="fg.muted">
                    Supabase URL
                  </Box>
                  <Box as="dd" truncate fontFamily="mono" fontSize="xs">
                    {envStatus.url}
                  </Box>
                </Flex>
              ) : null}
              <Flex align="center" justify="space-between" gap={4}>
                <Box as="dt" color="fg.muted">
                  Supabase API
                </Box>
                <Box as="dd" fontWeight="medium">
                  {envStatus.configured ? 'Ready' : 'Not configured'}
                </Box>
              </Flex>
            </Grid>
          </Box>
        </Stack>
      </Container>
    </Flex>
  )
}
