import { z } from 'zod'

import {
  classificationTypeSchema,
  competitionClassSchema,
  competitorLevelSchema,
  entryDivisionSchema,
  pairingStatusSchema,
} from '@/lib/derby/enums'

const optionalText = (max: number) =>
  z
    .string()
    .max(max)
    .optional()
    .or(z.literal(''))
    .transform((value) => value || undefined)

export const assignRoosterClassSchema = z.object({
  eventId: z.string().uuid(),
  roosterId: z.string().uuid(),
  competitionClass: competitionClassSchema,
  notes: optionalText(2000),
})

export const assignCompetitorLevelSchema = z.object({
  eventId: z.string().uuid().optional(),
  competitorId: z.string().uuid(),
  competitorLevel: competitorLevelSchema,
  notes: optionalText(2000),
})

export const assignEntryDivisionSchema = z.object({
  eventId: z.string().uuid(),
  entryId: z.string().uuid(),
  entryDivision: entryDivisionSchema,
  notes: optionalText(2000),
})

export const pairingRuleItemSchema = z.object({
  classificationType: classificationTypeSchema,
  firstValue: z.string().min(1).max(100),
  secondValue: z.string().min(1).max(100),
  pairingStatus: pairingStatusSchema.default('allowed'),
  notes: optionalText(2000),
})

export const upsertPairingRulesSchema = z.object({
  eventId: z.string().uuid(),
  rules: z.array(pairingRuleItemSchema).min(1),
})

export const getPairingStatusSchema = z.object({
  eventId: z.string().uuid(),
  classificationType: classificationTypeSchema,
  firstValue: z.string().min(1),
  secondValue: z.string().min(1),
})

export type AssignRoosterClassInput = z.infer<typeof assignRoosterClassSchema>
export type AssignCompetitorLevelInput = z.infer<typeof assignCompetitorLevelSchema>
export type AssignEntryDivisionInput = z.infer<typeof assignEntryDivisionSchema>
export type UpsertPairingRulesInput = z.infer<typeof upsertPairingRulesSchema>
export type GetPairingStatusInput = z.infer<typeof getPairingStatusSchema>

export function getPairingStatusFromRules(
  rules: Array<{
    classification_type: string
    first_value: string
    second_value: string
    pairing_status: string
  }>,
  classificationType: string,
  firstValue: string,
  secondValue: string
): string {
  const [a, b] = normalizePairingValues(firstValue, secondValue)
  const match = rules.find(
    (rule) =>
      rule.classification_type === classificationType &&
      ((rule.first_value === a && rule.second_value === b) ||
        (rule.first_value === b && rule.second_value === a))
  )
  return match?.pairing_status ?? 'allowed'
}

export function normalizePairingValues(firstValue: string, secondValue: string): [string, string] {
  return firstValue <= secondValue
    ? [firstValue, secondValue]
    : [secondValue, firstValue]
}
