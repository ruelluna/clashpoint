'use client'

import {
  Box,
  Card,
  Flex,
  Heading,
  Stack,
  Text,
} from '@chakra-ui/react'

import { LoginLayoutFallback } from '@/components/auth/login-layout-fallback'
import { ChakraClientRoot } from '@/components/chakra/client-root'
import { ColorModeButton } from '@/components/ui/color-mode-button'
import { LoginForm } from '@/features/auth/components/login-form'

type LoginPageClientProps = {
  redirectTo?: string
}

export function LoginPageClient({ redirectTo }: LoginPageClientProps) {
  return (
    <ChakraClientRoot fallback={<LoginLayoutFallback />}>
      <Flex
        minH="100vh"
        direction="column"
        align="center"
        justify="center"
        px={6}
        py={24}
        position="relative"
      >
        <Box position="absolute" top={4} right={4}>
          <ColorModeButton />
        </Box>
        <Box as="main" width="full" maxW="sm">
          <Stack gap={8}>
            <Stack gap={2} textAlign="center">
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
                Sign in
              </Heading>
              <Text fontSize="sm" color="fg.muted">
                Use the credentials provided by your organization.
              </Text>
            </Stack>

            <Card.Root>
              <Card.Body p={6}>
                <LoginForm redirectTo={redirectTo} />
              </Card.Body>
            </Card.Root>
          </Stack>
        </Box>
      </Flex>
    </ChakraClientRoot>
  )
}
