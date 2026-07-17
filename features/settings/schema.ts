import { z } from 'zod'

export const updateSettingsSchema = z.object({
  orgName: z.string().min(1).max(200),
  defaultVenue: z.string().min(1).max(200),
  legalDisclaimer: z.string().min(10).max(2000),
  termsAccepted: z.boolean(),
  allowPublicBreedAdd: z.boolean(),
  allowPublicColorAdd: z.boolean(),
})

export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>

export type SystemSettings = {
  orgName: string
  defaultVenue: string
  legalDisclaimer: string
  termsAccepted: boolean
  allowPublicBreedAdd: boolean
  allowPublicColorAdd: boolean
}
