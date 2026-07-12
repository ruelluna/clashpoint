'use client'

import {
  Button,
  Flex,
  Input,
  NativeSelect,
  Stack,
  Text,
  Textarea,
} from '@chakra-ui/react'
import Link from 'next/link'
import { useActionState, useState } from 'react'

import {
  ButtonGroup,
  FormField,
  LAYOUT_GAP,
  PageHeader,
  PageStack,
  PanelCard,
} from '@/components/dashboard'
import type { CompetitorSearchResult } from '@/features/competitors/types'
import {
  updateEntryAction,
  type EntryActionState,
} from '@/features/entries/actions'
import {
  OwnerPickerField,
  type OwnerProfileValues,
} from '@/features/entries/components/owner-picker-field'
import {
  EligibilityStatusSummary,
  RoosterPolicyFields,
} from '@/features/entries/components/rooster-policy-fields'
import type { EntryRoosterEditItem } from '@/features/entries/queries'
import { ENTRY_SOURCE_LABELS } from '@/features/entries/schema'
import type { EntryRow } from '@/features/entries/types'
import type { EntryFormEligibilityContext } from '@/features/eligibility/entry-form-context'
import type { PromoterListItem } from '@/features/promoters/types'

type EntryEditClientProps = {
  eventId: string
  eventName: string
  entry: EntryRow
  roosters: EntryRoosterEditItem[]
  promoters: PromoterListItem[]
  linkedCompetitor: CompetitorSearchResult | null
  minWeight: number | null
  maxWeight: number | null
  eligibilityContext?: EntryFormEligibilityContext | null
}

const initialState: EntryActionState = {}

function formatWeightRange(minWeight: number | null, maxWeight: number | null) {
  if (minWeight == null && maxWeight == null) return 'No weight limits configured'
  return `${minWeight ?? '—'} – ${maxWeight ?? '—'} kg`
}

export function EntryEditClient({
  eventId,
  eventName,
  entry,
  roosters,
  promoters,
  linkedCompetitor,
  minWeight,
  maxWeight,
  eligibilityContext = null,
}: EntryEditClientProps) {
  const [formState, formAction, pending] = useActionState(updateEntryAction, initialState)
  const [ownerProfile, setOwnerProfile] = useState<OwnerProfileValues>({
    contactNumber: entry.contact_number ?? '',
    email: entry.email ?? '',
    address: entry.address ?? '',
  })

  const activePromoters = promoters.filter((promoter) => promoter.status === 'active')

  return (
    <PageStack maxW="2xl">
      <PageHeader
        title="Edit rooster entry"
        description={`${eventName} · Entry #${entry.entry_number} · Weight limits: ${formatWeightRange(minWeight, maxWeight)}`}
      />

      <form action={formAction}>
        <Stack gap={LAYOUT_GAP.form}>
          <input type="hidden" name="eventId" value={eventId} />
          <input type="hidden" name="entryId" value={entry.id} />
          <input
            type="hidden"
            name="roosterIds"
            value={roosters.map((r) => r.rooster_id).join(',')}
          />

          <Text
            fontSize="sm"
            fontWeight="semibold"
            color="fg.muted"
            textTransform="uppercase"
          >
            Owner / handler
          </Text>

          <FormField label="Entry name" required>
            <Input
              name="entryName"
              required
              maxLength={200}
              defaultValue={entry.entry_name}
            />
          </FormField>

          <OwnerPickerField
            initialOwnerName={entry.owner_name}
            initialCompetitor={linkedCompetitor}
            onOwnerProfileChange={setOwnerProfile}
          />

          <FormField label="Handler name">
            <Input
              name="handlerName"
              maxLength={200}
              defaultValue={entry.handler_name ?? ''}
            />
          </FormField>

          <Flex gap={LAYOUT_GAP.form} direction={{ base: 'column', sm: 'row' }}>
            <FormField label="Contact number" flex="1">
              <Input
                name="contactNumber"
                maxLength={50}
                value={ownerProfile.contactNumber}
                onChange={(event) =>
                  setOwnerProfile((current) => ({
                    ...current,
                    contactNumber: event.target.value,
                  }))
                }
              />
            </FormField>
            <FormField label="Email" flex="1">
              <Input
                name="email"
                type="email"
                maxLength={200}
                value={ownerProfile.email}
                onChange={(event) =>
                  setOwnerProfile((current) => ({
                    ...current,
                    email: event.target.value,
                  }))
                }
              />
            </FormField>
          </Flex>

          <FormField label="Address">
            <Textarea
              name="address"
              rows={2}
              maxLength={500}
              value={ownerProfile.address}
              onChange={(event) =>
                setOwnerProfile((current) => ({
                  ...current,
                  address: event.target.value,
                }))
              }
            />
          </FormField>

          <Flex gap={LAYOUT_GAP.form} direction={{ base: 'column', sm: 'row' }}>
            <FormField label="Entry source" flex="1">
              <NativeSelect.Root>
                <NativeSelect.Field name="entrySource" defaultValue={entry.entry_source}>
                  {Object.entries(ENTRY_SOURCE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </NativeSelect.Field>
              </NativeSelect.Root>
            </FormField>
            <FormField label="Referred by promoter" flex="1">
              <NativeSelect.Root>
                <NativeSelect.Field
                  name="referredByPromoterId"
                  defaultValue={entry.referred_by_promoter_id ?? ''}
                >
                  <option value="">None</option>
                  {activePromoters.map((promoter) => (
                    <option key={promoter.id} value={promoter.id}>
                      {promoter.name}
                    </option>
                  ))}
                </NativeSelect.Field>
              </NativeSelect.Root>
            </FormField>
          </Flex>

          <FormField label="Notes">
            <Textarea
              name="notes"
              rows={3}
              maxLength={2000}
              defaultValue={entry.notes ?? ''}
            />
          </FormField>

          {roosters.length > 0 ? (
            <>
              <Text
                fontSize="sm"
                fontWeight="semibold"
                color="fg.muted"
                textTransform="uppercase"
                pt={2}
              >
                Roosters &amp; weights
              </Text>
              {roosters.map((rooster) => (
                <PanelCard key={rooster.rooster_id}>
                  <Text fontSize="sm" fontWeight="medium" mb={3}>
                    Cock #{rooster.cock_number}
                    {rooster.is_paired ? (
                      <Text
                        as="span"
                        fontSize="xs"
                        color="fg.muted"
                        fontWeight="normal"
                        ml={2}
                      >
                        (in a match — rooster details locked)
                      </Text>
                    ) : null}
                  </Text>
                  <Flex gap={LAYOUT_GAP.form} direction={{ base: 'column', sm: 'row' }}>
                    <FormField label="Band number" required flex="1">
                      <Input
                        name={`bandNumber_${rooster.rooster_id}`}
                        required
                        maxLength={50}
                        defaultValue={rooster.band_number}
                        disabled={rooster.is_paired}
                      />
                    </FormField>
                    <FormField label="Weight (kg)" required flex="1">
                      <Input
                        name={`weight_${rooster.rooster_id}`}
                        type="number"
                        step="0.01"
                        min="0"
                        required
                        defaultValue={
                          rooster.weight != null ? String(rooster.weight) : ''
                        }
                        disabled={rooster.is_paired}
                      />
                    </FormField>
                  </Flex>
                  <RoosterPolicyFields
                    eligibilityContext={eligibilityContext}
                    fieldPrefix={rooster.rooster_id}
                    disabled={rooster.is_paired}
                    defaults={{
                      ageClass: rooster.age_class ?? undefined,
                      category: rooster.category ?? undefined,
                      colorMarking: rooster.color_marking ?? undefined,
                      originType: rooster.origin_type ?? undefined,
                      breedingRelationship: rooster.breeding_relationship ?? undefined,
                      experienceStatus: rooster.experience_status ?? undefined,
                      bandLevel: rooster.band_level ?? undefined,
                      bandOrganization: rooster.band_organization ?? undefined,
                      bandYear: rooster.band_year,
                      bandSeason: rooster.band_season ?? undefined,
                    }}
                  />
                  <EligibilityStatusSummary
                    status={rooster.eligibility_status}
                    checks={rooster.eligibility_checks}
                  />
                </PanelCard>
              ))}
            </>
          ) : null}

          {formState.error ? (
            <Text fontSize="sm" color="red.500" whiteSpace="pre-line">
              {formState.error}
            </Text>
          ) : null}

          <ButtonGroup>
            <Button type="submit" loading={pending}>
              Save entry
            </Button>
            <Button asChild variant="outline">
              <Link href={`/dashboard/events/${eventId}/rooster-entries`}>Cancel</Link>
            </Button>
          </ButtonGroup>
        </Stack>
      </form>
    </PageStack>
  )
}
