'use client'

import { Button, Flex, Input, Stack, Text } from '@chakra-ui/react'
import { useCallback, useState } from 'react'

type RegistrationShareLinkProps = {
  eventId: string
  registrationPath?: string
}

export function RegistrationShareLink({
  eventId,
  registrationPath,
}: RegistrationShareLinkProps) {
  const path = registrationPath ?? `/events/${eventId}/register`
  const [copied, setCopied] = useState(false)

  const fullUrl =
    typeof window !== 'undefined' ? `${window.location.origin}${path}` : path

  const copyLink = useCallback(async () => {
    const url =
      typeof window !== 'undefined' ? `${window.location.origin}${path}` : path
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }, [path])

  return (
    <Stack gap={3} fontSize="sm">
      <Text color="fg.muted">
        Share this link so entrants can register online in two steps: game farm details, then
        rooster registration. Submissions are accepted only while the event is{' '}
        <strong>Open</strong> and before the registration deadline when one is set.
      </Text>
      <Flex gap={2} align="center" wrap="wrap">
        <Input readOnly value={fullUrl} flex="1" minW="16rem" fontSize="sm" />
        <Button size="sm" variant="outline" onClick={copyLink}>
          {copied ? 'Copied' : 'Copy link'}
        </Button>
      </Flex>
    </Stack>
  )
}
