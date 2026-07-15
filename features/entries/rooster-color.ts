export function colorMarkingFieldName(slotKey: string, mode: 'create' | 'edit' | 'staff') {
  if (mode === 'staff') return 'colorMarking'
  if (mode === 'create') return `colorMarking_rooster_${slotKey}`
  return `colorMarking_${slotKey}`
}

export function notesFieldName(mode: 'create' | 'edit', slotKey: string) {
  if (mode === 'create') {
    return `notes_rooster_${slotKey}`
  }
  return `notes_${slotKey}`
}

export function breedFieldName(slotKey: string, mode: 'create' | 'edit' | 'staff') {
  if (mode === 'staff') return 'breed'
  if (mode === 'create') return `breed_rooster_${slotKey}`
  return `breed_${slotKey}`
}

export function parseRoosterColorFromForm(
  formData: FormData,
  slotKey: string,
  mode: 'create' | 'edit' | 'staff'
): string | undefined {
  return formData.get(colorMarkingFieldName(slotKey, mode))?.toString().trim() || undefined
}

export function parseRoosterBreedFromForm(
  formData: FormData,
  slotKey: string,
  mode: 'create' | 'edit' | 'staff'
): string | undefined {
  return formData.get(breedFieldName(slotKey, mode))?.toString().trim() || undefined
}
