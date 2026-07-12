import { z } from 'zod'

import { evaluateWeightEligibility } from '@/features/eligibility/schema'
import type { EligibilityFieldKey } from '@/lib/derby/eligibility-fields'
import {
  ageClassSchema,
  bandLevelSchema,
  breedingRelationshipSchema,
  experienceStatusSchema,
  kgToGrams,
  originTypeSchema,
  type UnknownValueHandling,
} from '@/lib/derby/enums'

export type RoosterPolicyValidationContext = {
  enabledFields: EligibilityFieldKey[]
  unknownValueHandling: UnknownValueHandling
  allowedAgeClasses: string[]
  minimumWeightGrams: number | null
  maximumWeightGrams: number | null
  bandingRequired: boolean
  acceptedBandLevels: string[]
  acceptedBandOrganizations: string[]
  acceptedBandYears: number[]
  acceptedBandSeasons: string[]
}

export type RoosterPolicyInput = {
  weight: number
  ageClass?: string
  category?: string
  originType?: string
  breedingRelationship?: string
  experienceStatus?: string
  bandLevel?: string
  bandOrganization?: string
  bandYear?: number
  bandSeason?: string
}

const optionalText = (max: number) =>
  z
    .string()
    .max(max)
    .optional()
    .or(z.literal(''))
    .transform((value) => value || undefined)

export const entryRoosterPolicyFieldsSchema = {
  ageClass: ageClassSchema.optional(),
  originType: originTypeSchema.optional(),
  breedingRelationship: breedingRelationshipSchema.optional(),
  experienceStatus: experienceStatusSchema.optional(),
  bandLevel: bandLevelSchema.optional(),
  bandOrganization: optionalText(200),
  bandYear: z.coerce.number().int().min(1900).max(2100).optional(),
  bandSeason: optionalText(100),
}

function isFieldEnabled(
  context: RoosterPolicyValidationContext,
  field: EligibilityFieldKey
): boolean {
  return context.enabledFields.includes(field)
}

export function validateRoosterAgainstPolicy(
  input: RoosterPolicyInput,
  context: RoosterPolicyValidationContext | null
): string | null {
  if (!context || context.enabledFields.length === 0) return null

  if (isFieldEnabled(context, 'weight')) {
    const weightGrams = kgToGrams(input.weight)
    const outcome = evaluateWeightEligibility(
      weightGrams,
      context.minimumWeightGrams,
      context.maximumWeightGrams
    )
    if (outcome === 'fail') {
      if (
        context.minimumWeightGrams != null &&
        weightGrams < context.minimumWeightGrams
      ) {
        return 'Weight is below the event minimum.'
      }
      return 'Weight is above the event maximum.'
    }
  }

  if (isFieldEnabled(context, 'age_class')) {
    const ageClass = input.ageClass ?? 'unknown'
    if (
      context.unknownValueHandling === 'prohibit' &&
      (!ageClass || ageClass === 'unknown')
    ) {
      return 'Age class is required for this event.'
    }
    if (
      context.allowedAgeClasses.length > 0 &&
      ageClass !== 'unknown' &&
      !context.allowedAgeClasses.includes(ageClass)
    ) {
      return `Age class ${ageClass} is not allowed for this event.`
    }
  }

  if (isFieldEnabled(context, 'banding') && context.bandingRequired) {
    if (!input.bandLevel || input.bandLevel === 'unbanded' || input.bandLevel === 'unknown') {
      return 'Band level is required for this event.'
    }
    if (
      context.acceptedBandLevels.length > 0 &&
      !context.acceptedBandLevels.includes(input.bandLevel)
    ) {
      return 'Selected band level is not accepted for this event.'
    }
    if (
      context.acceptedBandOrganizations.length > 0 &&
      input.bandOrganization &&
      !context.acceptedBandOrganizations.includes(input.bandOrganization)
    ) {
      return 'Band organization is not accepted for this event.'
    }
    if (
      context.acceptedBandYears.length > 0 &&
      input.bandYear != null &&
      !context.acceptedBandYears.includes(input.bandYear)
    ) {
      return 'Band year is not accepted for this event.'
    }
    if (
      context.acceptedBandSeasons.length > 0 &&
      input.bandSeason &&
      !context.acceptedBandSeasons.includes(input.bandSeason)
    ) {
      return 'Band season is not accepted for this event.'
    }
  }

  if (isFieldEnabled(context, 'experience')) {
    const experience = input.experienceStatus ?? 'unknown'
    if (
      context.unknownValueHandling === 'prohibit' &&
      (!experience || experience === 'unknown')
    ) {
      return 'Experience status is required for this event.'
    }
  }

  if (isFieldEnabled(context, 'origin')) {
    const originType = input.originType ?? 'unknown'
    if (
      context.unknownValueHandling === 'prohibit' &&
      (!originType || originType === 'unknown')
    ) {
      return 'Origin type is required for this event.'
    }
  }

  return null
}
