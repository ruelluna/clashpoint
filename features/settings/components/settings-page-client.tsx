'use client'

import { Button, Checkbox, Input, Stack, Text, Textarea } from '@chakra-ui/react'
import { useActionState } from 'react'

import { LAYOUT_GAP, FormField, PageHeader, PageStack, PanelCard } from '@/components/dashboard'
import { ReferenceOptionsManager } from '@/features/settings/components/reference-options-manager'
import {
  updateSettingsAction,
  type SettingsActionState,
} from '@/features/settings/actions'
import type { SystemSettings } from '@/features/settings/schema'
import type { RoosterEntryCatalog } from '@/features/reference-values/catalog'

type SettingsPageClientProps = {
  settings: SystemSettings
  catalog: RoosterEntryCatalog
}

export function SettingsPageClient({ settings, catalog }: SettingsPageClientProps) {
  const [state, action, pending] = useActionState(updateSettingsAction, {} as SettingsActionState)

  return (
    <PageStack maxW="2xl">
      <PageHeader
        title="Settings"
        description="Organization, compliance, and rooster catalog settings."
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
            <Checkbox.Root
              defaultChecked={settings.allowPublicBreedAdd}
              data-testid="settings-allow-public-breed-add"
            >
              <Checkbox.HiddenInput name="allowPublicBreedAdd" />
              <Checkbox.Control />
              <Checkbox.Label>Allow public registrants to add new breeds</Checkbox.Label>
            </Checkbox.Root>
            <Checkbox.Root
              defaultChecked={settings.allowPublicColorAdd}
              data-testid="settings-allow-public-color-add"
            >
              <Checkbox.HiddenInput name="allowPublicColorAdd" />
              <Checkbox.Control />
              <Checkbox.Label>Allow public registrants to add new colors</Checkbox.Label>
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

      <PanelCard>
        <ReferenceOptionsManager
          kind="breed"
          title="Breed options"
          items={catalog.breeds}
          testIdPrefix="settings-breed-options"
        />
      </PanelCard>

      <PanelCard>
        <ReferenceOptionsManager
          kind="color_marking"
          title="Color options"
          items={catalog.colors}
          testIdPrefix="settings-color-options"
        />
      </PanelCard>
    </PageStack>
  )
}
