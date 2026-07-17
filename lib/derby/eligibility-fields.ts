import {
  AGE_CLASS_LABELS,
  ageClassSchema,
  bandLevelSchema,
  breedingRelationshipSchema,
  experienceStatusSchema,
  originTypeSchema,
} from '@/lib/derby/enums'

export const ELIGIBILITY_FIELD_KEYS = [
  'age_class',
  'weight',
  'banding',
] as const

export type EligibilityFieldKey = (typeof ELIGIBILITY_FIELD_KEYS)[number]

export const ELIGIBILITY_FIELD_LABELS: Record<EligibilityFieldKey, string> = {
  age_class: 'Age class',
  weight: 'Weight limits',
  banding: 'Banding',
}

export const ELIGIBILITY_FIELD_DESCRIPTIONS: Record<EligibilityFieldKey, string> = {
  age_class: 'Restrict which age classes (stag, bullstag, cock) may enter.',
  weight: 'Set minimum and maximum weight limits and whether official weighing is required.',
  banding: 'Require bands and restrict accepted levels, organizations, years, or seasons.',
}

export const ELIGIBILITY_FIELD_TO_CHECK = {
  age_class: 'age',
  weight: 'weight',
  banding: 'banding',
} as const satisfies Record<EligibilityFieldKey, string>

export type EligibilityOptionPreset = {
  value: string
  label: string
}

export const AGE_CLASS_PRESETS: EligibilityOptionPreset[] = ageClassSchema.options
  .filter((value) => value !== 'unknown')
  .map((value) => ({
    value,
    label: AGE_CLASS_LABELS[value],
  }))

export const BAND_LEVEL_PRESETS: EligibilityOptionPreset[] = bandLevelSchema.options
  .filter((value) => value !== 'unbanded')
  .map((value) => ({
    value,
    label: value
      .split('_')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' '),
  }))

export const EXPERIENCE_STATUS_PRESETS: EligibilityOptionPreset[] =
  experienceStatusSchema.options
    .filter((value) => value !== 'unknown')
    .map((value) => ({
      value,
      label: value
        .split('_')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' '),
    }))

export const ORIGIN_TYPE_PRESETS: EligibilityOptionPreset[] = originTypeSchema.options
  .filter((value) => value !== 'unknown')
  .map((value) => ({
    value,
    label: value
      .split('_')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' '),
  }))

export const BREEDING_RELATIONSHIP_PRESETS: EligibilityOptionPreset[] =
  breedingRelationshipSchema.options
    .filter((value) => value !== 'unknown')
    .map((value) => ({
      value,
      label: value
        .split('_')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' '),
    }))

export function isEligibilityFieldEnabled(
  enabledFields: string[] | null | undefined,
  field: EligibilityFieldKey
): boolean {
  if (!enabledFields?.length) return false
  return enabledFields.includes(field)
}

export function parseEligibilityFieldKeys(values: string[]): EligibilityFieldKey[] {
  const allowed = new Set<string>(ELIGIBILITY_FIELD_KEYS)
  return values.filter((value): value is EligibilityFieldKey => allowed.has(value))
}
