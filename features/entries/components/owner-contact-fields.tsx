'use client'

import { Flex, Input } from '@chakra-ui/react'

import { FormField, LAYOUT_GAP } from '@/components/dashboard'
import { ContactNumberField } from '@/features/entries/components/contact-number-field'

export type OwnerContactValues = {
  contactFullName: string
  contactDesignation: string
  contactNumber: string
  email: string
}

type OwnerContactFieldsProps = {
  values: OwnerContactValues
  onChange: (values: OwnerContactValues) => void
}

export function OwnerContactFields({ values, onChange }: OwnerContactFieldsProps) {
  return (
    <>
      <Flex gap={LAYOUT_GAP.form} direction={{ base: 'column', sm: 'row' }}>
        <FormField label="Full name" flex="1">
          <Input
            name="contactFullName"
            maxLength={200}
            value={values.contactFullName}
            onChange={(event) =>
              onChange({ ...values, contactFullName: event.target.value })
            }
          />
        </FormField>
        <FormField label="Designation" flex="1">
          <Input
            name="contactDesignation"
            maxLength={200}
            value={values.contactDesignation}
            onChange={(event) =>
              onChange({ ...values, contactDesignation: event.target.value })
            }
          />
        </FormField>
      </Flex>

      <Flex gap={LAYOUT_GAP.form} direction={{ base: 'column', sm: 'row' }}>
        <ContactNumberField
          flex="1"
          value={values.contactNumber}
          onChange={(contactNumber) => onChange({ ...values, contactNumber })}
        />
        <FormField label="Email" flex="1">
          <Input
            name="email"
            type="email"
            maxLength={200}
            value={values.email}
            onChange={(event) => onChange({ ...values, email: event.target.value })}
          />
        </FormField>
      </Flex>
    </>
  )
}
