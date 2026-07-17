import { z } from 'zod'

import { ELIGIBILITY_FIELD_KEYS } from '@/lib/derby/eligibility-fields'
import {
  bandLevelSchema,
  breedingRelationshipSchema,
  experienceStatusSchema,
  originTypeSchema,
  policyStatusSchema,
  unknownValueHandlingSchema,
} from '@/lib/derby/enums'

export const evaluateEligibilitySchema = z.object({
  eventId: z.string().uuid(),
  registrationId: z.string().uuid(),
})

export const eligibilityFieldKeySchema = z.enum(ELIGIBILITY_FIELD_KEYS)

export const upsertEligibilityPolicySchema = z
  .object({
    eventId: z.string().uuid(),
    policyStatus: policyStatusSchema.default('active'),
    enabledFields: z.array(eligibilityFieldKeySchema).default([]),
    eligibilityEnforcementEnabled: z.boolean().default(false),
    allowedAgeClasses: z.array(z.string()).default([]),
    minimumWeightGrams: z.coerce.number().int().positive().nullable().optional(),
    maximumWeightGrams: z.coerce.number().int().positive().nullable().optional(),
    weightVerificationRequired: z.boolean().default(false),
    bandingRequired: z.boolean().default(false),
    allowUnbanded: z.boolean().default(true),
    bandVerificationRequired: z.boolean().default(false),
    acceptedBandLevels: z.array(bandLevelSchema).default([]),
    acceptedBandOrganizations: z.array(z.string().min(1).max(200)).default([]),
    acceptedBandYears: z.array(z.coerce.number().int().min(1900).max(2100)).default([]),
    acceptedBandSeasons: z.array(z.string().min(1).max(100)).default([]),
    allowedExperienceStatuses: z.array(experienceStatusSchema).default([]),
    allowedOriginTypes: z.array(originTypeSchema).default([]),
    allowedBreedingRelationships: z.array(breedingRelationshipSchema).default([]),
    associationMembersOnly: z.boolean().default(false),
    approvedAssociationIds: z.array(z.string().uuid()).default([]),
    locallyBredOnly: z.boolean().default(false),
    importedAllowed: z.boolean().default(true),
    originVerificationRequired: z.boolean().default(false),
    physicalInspectionRequired: z.boolean().default(false),
    entryFeePaymentRequired: z.boolean().default(false),
    unknownValueHandling: unknownValueHandlingSchema.default('approval_required'),
    eligibilityNotes: z.string().max(5000).nullable().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.enabledFields.includes('age_class') && data.allowedAgeClasses.length === 0) {
      ctx.addIssue({
        code: 'custom',
        message: 'Add at least one age class when age rules are enabled',
        path: ['allowedAgeClasses'],
      })
    }

    if (
      data.minimumWeightGrams != null &&
      data.maximumWeightGrams != null &&
      data.minimumWeightGrams > data.maximumWeightGrams
    ) {
      ctx.addIssue({
        code: 'custom',
        message: 'Minimum weight cannot exceed maximum weight',
        path: ['maximumWeightGrams'],
      })
    }
  })

export type EvaluateEligibilityInput = z.infer<typeof evaluateEligibilitySchema>
export type UpsertEligibilityPolicyInput = z.infer<typeof upsertEligibilityPolicySchema>

export function evaluateWeightEligibility(
  weightGrams: number | null,
  minGrams: number | null,
  maxGrams: number | null
): 'pass' | 'fail' | 'pending' {
  if (weightGrams == null) return 'pending'
  if (minGrams != null && weightGrams < minGrams) return 'fail'
  if (maxGrams != null && weightGrams > maxGrams) return 'fail'
  return 'pass'
}
