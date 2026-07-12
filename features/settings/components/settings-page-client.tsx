'use client'

import { Box, Button, Checkbox, Input, Stack, Text, Textarea } from '@chakra-ui/react'
import { useActionState } from 'react'

import { LAYOUT_GAP, FormField, PageHeader, PageStack, PanelCard } from '@/components/dashboard'
import {
  updateSettingsAction,
  type SettingsActionState,
} from '@/features/settings/actions'
import type { SystemSettings } from '@/features/settings/schema'

export function SettingsPageClient({ settings }: { settings: SystemSettings }) {
  const [state, action, pending] = useActionState(updateSettingsAction, {} as SettingsActionState)

  return (
    <PageStack maxW="xl">
      <PageHeader
        title="Settings"
        description="Organization and compliance settings."
      />

      <PanelCard>
        <form action={action}>
          <Stack gap={LAYOUT_GAP.form}>
            <FormField label="Organization name" required>
              <Input name="orgName" defaultValue={settings.orgName} required />
            </FormField>
            <FormField
              label="Default venue name"
              required
              helpText="Applied to new and updated events. Shown on event lists and public pages."
            >
              <Input name="defaultVenue" defaultValue={settings.defaultVenue} required />
            </FormField>
            <FormField label="Legal disclaimer" required>
              <Textarea
                name="legalDisclaimer"
                defaultValue={settings.legalDisclaimer}
                rows={4}
                required
              />
            </FormField>
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
          </Stack>
        </form>
      </PanelCard>
    </PageStack>
  )
}
