'use client'

import { Box, Button, Checkbox, Flex, Input, Text, Textarea } from '@chakra-ui/react'
import { useActionState } from 'react'

import {
  updateSettingsAction,
  type SettingsActionState,
} from '@/features/settings/actions'
import type { SystemSettings } from '@/features/settings/schema'

export function SettingsPageClient({ settings }: { settings: SystemSettings }) {
  const [state, action, pending] = useActionState(updateSettingsAction, {} as SettingsActionState)

  return (
    <Box className="space-y-6">
      <Box>
        <Text fontSize="2xl" fontWeight="semibold">
          Settings
        </Text>
        <Text color="fg.muted">Organization and compliance settings.</Text>
      </Box>

      <Box borderWidth="1px" borderColor="border" rounded="lg" p={4} maxW="xl">
        <form action={action}>
          <Flex direction="column" gap={4}>
            <Box>
              <Text fontSize="sm" fontWeight="medium" mb={1}>
                Organization name
              </Text>
              <Input name="orgName" defaultValue={settings.orgName} required />
            </Box>
            <Box>
              <Text fontSize="sm" fontWeight="medium" mb={1}>
                Default venue name
              </Text>
              <Input name="defaultVenue" defaultValue={settings.defaultVenue} required />
              <Text fontSize="xs" color="fg.muted" mt={1}>
                Applied to new and updated events. Shown on event lists and public pages.
              </Text>
            </Box>
            <Box>
              <Text fontSize="sm" fontWeight="medium" mb={1}>
                Legal disclaimer
              </Text>
              <Textarea
                name="legalDisclaimer"
                defaultValue={settings.legalDisclaimer}
                rows={4}
                required
              />
            </Box>
            <Checkbox.Root defaultChecked={settings.termsAccepted} name="termsAccepted">
              <Checkbox.HiddenInput name="termsAccepted" />
              <Checkbox.Control />
              <Checkbox.Label>Terms of use accepted for this organization</Checkbox.Label>
            </Checkbox.Root>
            <Button type="submit" loading={pending} alignSelf="flex-start">
              Save settings
            </Button>
            {state.error ? (
              <Text color="fg.error" fontSize="sm">
                {state.error}
              </Text>
            ) : null}
            {state.success ? (
              <Text color="fg.success" fontSize="sm">
                {state.success}
              </Text>
            ) : null}
          </Flex>
        </form>
      </Box>
    </Box>
  )
}
