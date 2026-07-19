'use client'

import { Textarea } from '@chakra-ui/react'

import { FormField } from '@/components/dashboard'
import {
  breedFieldName,
  colorMarkingFieldName,
  notesFieldName,
} from '@/features/entries/rooster-color'
import type { RoosterEntryCatalog } from '@/features/reference-values/catalog'
import { ReferenceValuePicker } from '@/features/reference-values/components/reference-value-picker'

type RoosterEntryCoreFieldsProps = {
  slotKey: string
  mode: 'create' | 'edit' | 'staff'
  catalog: RoosterEntryCatalog
  allowBreedCreate?: boolean
  allowColorCreate?: boolean
  disabled?: boolean
  required?: boolean
  defaults?: {
    breed?: string | null
    colorMarking?: string | null
    notes?: string | null
  }
}

export function RoosterEntryCoreFields({
  slotKey,
  mode,
  catalog,
  allowBreedCreate = false,
  allowColorCreate = false,
  disabled = false,
  required = false,
  defaults,
}: RoosterEntryCoreFieldsProps) {
  const notesName =
    mode === 'staff'
      ? 'notes'
      : notesFieldName(mode === 'create' ? 'create' : 'edit', slotKey)

  return (
    <>
      <ReferenceValuePicker
        kind="breed"
        name={breedFieldName(slotKey, mode)}
        label="Breed"
        options={catalog.breeds}
        defaultValue={defaults?.breed ?? ''}
        maxLength={100}
        disabled={disabled}
        required={required}
        allowCreate={allowBreedCreate}
      />
      <ReferenceValuePicker
        kind="color_marking"
        name={colorMarkingFieldName(slotKey, mode)}
        label="Color"
        options={catalog.colors}
        defaultValue={defaults?.colorMarking ?? ''}
        maxLength={200}
        disabled={disabled}
        required={required}
        allowCreate={allowColorCreate}
      />
      <FormField label="Notes">
        <Textarea
          name={notesName}
          rows={2}
          maxLength={2000}
          defaultValue={defaults?.notes ?? ''}
          disabled={disabled}
        />
      </FormField>
    </>
  )
}
