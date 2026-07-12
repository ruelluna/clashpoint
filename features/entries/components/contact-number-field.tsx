'use client'

import { Input, InputGroup } from '@chakra-ui/react'
import { useMemo } from 'react'

import { FormField } from '@/components/dashboard'
import {
  CONTACT_NUMBER_PATTERN,
  CONTACT_NUMBER_PREFIX,
} from '@/features/entries/schema'

type ContactNumberFieldProps = {
  name?: string
  value: string
  onChange: (fullNumber: string) => void
  required?: boolean
  flex?: string
}

const SUFFIX_LENGTH = 10

function splitContactNumber(fullNumber: string): string {
  if (!fullNumber) return ''
  if (fullNumber.startsWith(CONTACT_NUMBER_PREFIX)) {
    return fullNumber.slice(CONTACT_NUMBER_PREFIX.length).replace(/\D/g, '').slice(0, SUFFIX_LENGTH)
  }
  return fullNumber.replace(/\D/g, '').slice(0, SUFFIX_LENGTH)
}

function buildContactNumber(suffix: string): string {
  const digits = suffix.replace(/\D/g, '').slice(0, SUFFIX_LENGTH)
  return digits.length > 0 ? `${CONTACT_NUMBER_PREFIX}${digits}` : ''
}

export function ContactNumberField({
  name = 'contactNumber',
  value,
  onChange,
  required = false,
  flex,
}: ContactNumberFieldProps) {
  const suffix = useMemo(() => splitContactNumber(value), [value])
  const isInvalid = value.length > 0 && !CONTACT_NUMBER_PATTERN.test(value)

  return (
    <FormField
      label="Contact number"
      flex={flex}
      helpText="10 digits after +63 (e.g. 9171234567)"
    >
      <input type="hidden" name={name} value={value} />
      <InputGroup startElement={CONTACT_NUMBER_PREFIX}>
        <Input
          inputMode="numeric"
          pattern="\d{10}"
          maxLength={SUFFIX_LENGTH}
          placeholder="9171234567"
          value={suffix}
          required={required}
          aria-invalid={isInvalid || undefined}
          onChange={(event) => onChange(buildContactNumber(event.target.value))}
        />
      </InputGroup>
    </FormField>
  )
}

export { buildContactNumber, splitContactNumber }
