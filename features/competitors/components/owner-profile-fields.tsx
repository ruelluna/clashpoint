'use client'

import { Input, Stack, Textarea } from '@chakra-ui/react'

import { FormField, LAYOUT_GAP } from '@/components/dashboard'
import { ContactNumberField } from '@/features/entries/components/contact-number-field'
import type { CompetitorOwnerProfile } from '@/features/competitors/types'

type OwnerProfileFieldsProps = {
  values: CompetitorOwnerProfile
  onChange: (values: CompetitorOwnerProfile) => void
  showNotes?: boolean
}

export function OwnerProfileFields({
  values,
  onChange,
  showNotes = false,
}: OwnerProfileFieldsProps) {
  return (
    <Stack gap={LAYOUT_GAP.form}>
      <FormField label="Owner name / game farm" required>
        <Input
          name="displayName"
          value={values.displayName}
          maxLength={200}
          required
          onChange={(event) =>
            onChange({ ...values, displayName: event.target.value })
          }
        />
      </FormField>

      <FormField label="Full name">
        <Input
          name="contactFullName"
          value={values.contactFullName ?? ''}
          maxLength={200}
          onChange={(event) =>
            onChange({ ...values, contactFullName: event.target.value })
          }
        />
      </FormField>

      <FormField label="Designation">
        <Input
          name="contactDesignation"
          value={values.contactDesignation ?? ''}
          maxLength={200}
          onChange={(event) =>
            onChange({ ...values, contactDesignation: event.target.value })
          }
        />
      </FormField>

      <ContactNumberField
        value={values.contactNumber ?? ''}
        onChange={(contactNumber) => onChange({ ...values, contactNumber })}
      />

      <FormField label="Email">
        <Input
          name="email"
          type="email"
          maxLength={200}
          value={values.email ?? ''}
          onChange={(event) => onChange({ ...values, email: event.target.value })}
        />
      </FormField>

      <FormField label="Address">
        <Textarea
          name="address"
          rows={2}
          maxLength={500}
          value={values.address ?? ''}
          onChange={(event) => onChange({ ...values, address: event.target.value })}
        />
      </FormField>

      {showNotes ? (
        <FormField label="Notes">
          <Textarea
            name="notes"
            rows={3}
            maxLength={2000}
            value={values.notes ?? ''}
            onChange={(event) => onChange({ ...values, notes: event.target.value })}
          />
        </FormField>
      ) : null}
    </Stack>
  )
}
