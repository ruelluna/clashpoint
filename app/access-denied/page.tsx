import { redirect } from 'next/navigation'
import {
  Box,
  Button,
  Card,
  Flex,
  Heading,
  Stack,
  Text,
} from '@chakra-ui/react'

import { signOutAction } from '@/features/auth/actions'
import { getProfile } from '@/lib/auth/queries'
import { getPromoterAccessDeniedReason } from '@/lib/auth/promoter-access'
import { getUser } from '@/lib/auth/session'

export default async function AccessDeniedPage() {
  const user = await getUser()

  if (!user) {
    redirect('/login')
  }

  const profile = await getProfile(user.id)
  let reason = profile
    ? 'Your account does not have admin access.'
    : 'Your profile was not found. Contact support to finish setup.'

  if (profile?.role === 'promoter') {
    const promoterReason = await getPromoterAccessDeniedReason(profile)
    if (promoterReason) {
      reason = promoterReason
    }
  }

  const helperText =
    profile?.role === 'promoter'
      ? 'Sign out and contact your organizer if you need access restored.'
      : 'Sign out and use an admin account, or contact your organization for access.'

  return (
    <Flex
        minH="100vh"
        direction="column"
        align="center"
        justify="center"
        px={6}
        py={24}
      >
        <Box as="main" width="full" maxW="md">
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
                Access denied
              </Heading>
              <Text fontSize="sm" color="fg.muted">
                {reason}
              </Text>
            </Stack>

            <Card.Root>
              <Card.Body p={6}>
                <Stack gap={4}>
                  <Text fontSize="sm" color="fg.muted">
                    {helperText}
                  </Text>
                  <form action={signOutAction}>
                    <Button type="submit" width="full" colorPalette="blue">
                      Sign out
                    </Button>
                  </form>
                </Stack>
              </Card.Body>
            </Card.Root>
          </Stack>
        </Box>
      </Flex>
  )
}
