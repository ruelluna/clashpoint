'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { createRoosterSchema, updateRoosterSchema } from '@/features/roosters/schema'
import { createRooster, updateRooster } from '@/features/roosters/service'
import { requirePermission } from '@/lib/auth/permissions'

export type RoosterActionState = { error?: string; success?: string }

export async function createRoosterAction(
  _prev: RoosterActionState,
  formData: FormData
): Promise<RoosterActionState> {
  const profile = await requirePermission('rooster.create')

  const parsed = createRoosterSchema.safeParse({
    name: formData.get('name')?.toString().trim() || undefined,
    competitorId: formData.get('competitorId')?.toString().trim() || undefined,
    gamefarmId: formData.get('gamefarmId')?.toString().trim() || undefined,
    breederId: formData.get('breederId')?.toString().trim() || undefined,
    ageClass: formData.get('ageClass') ?? 'unknown',
    hatchDate: formData.get('hatchDate')?.toString().trim() || undefined,
    hatchDateIsEstimated: formData.get('hatchDateIsEstimated') === 'on',
    competitionClass: formData.get('competitionClass') ?? 'unclassified',
    breed: formData.get('breed')?.toString().trim() || undefined,
    bloodline: formData.get('bloodline')?.toString().trim() || undefined,
    declaredExternalExperienceStatus:
      formData.get('declaredExternalExperienceStatus')?.toString().trim() || undefined,
    originType: formData.get('originType') ?? 'unknown',
    countryOfOrigin: formData.get('countryOfOrigin')?.toString().trim() || undefined,
    provinceOfOrigin: formData.get('provinceOfOrigin')?.toString().trim() || undefined,
    municipalityOfOrigin: formData.get('municipalityOfOrigin')?.toString().trim() || undefined,
    breederNameExternal: formData.get('breederNameExternal')?.toString().trim() || undefined,
    breedingRelationship: formData.get('breedingRelationship') ?? 'unknown',
    originNotes: formData.get('originNotes')?.toString().trim() || undefined,
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }

  const result = await createRooster(profile.id, parsed.data)
  if (result.error) return { error: result.error }

  revalidatePath('/dashboard/roosters')
  redirect(`/dashboard/roosters/${result.roosterId}`)
}

export async function updateRoosterAction(
  _prev: RoosterActionState,
  formData: FormData
): Promise<RoosterActionState> {
  const profile = await requirePermission('rooster.update')

  const parsed = updateRoosterSchema.safeParse({
    roosterId: formData.get('roosterId'),
    name: formData.get('name')?.toString().trim() || undefined,
    competitorId: formData.get('competitorId')?.toString().trim() || undefined,
    gamefarmId: formData.get('gamefarmId')?.toString().trim() || undefined,
    breederId: formData.get('breederId')?.toString().trim() || undefined,
    ageClass: formData.get('ageClass') ?? 'unknown',
    hatchDate: formData.get('hatchDate')?.toString().trim() || undefined,
    hatchDateIsEstimated: formData.get('hatchDateIsEstimated') === 'on',
    competitionClass: formData.get('competitionClass') ?? 'unclassified',
    breed: formData.get('breed')?.toString().trim() || undefined,
    bloodline: formData.get('bloodline')?.toString().trim() || undefined,
    declaredExternalExperienceStatus:
      formData.get('declaredExternalExperienceStatus')?.toString().trim() || undefined,
    originType: formData.get('originType') ?? 'unknown',
    countryOfOrigin: formData.get('countryOfOrigin')?.toString().trim() || undefined,
    provinceOfOrigin: formData.get('provinceOfOrigin')?.toString().trim() || undefined,
    municipalityOfOrigin: formData.get('municipalityOfOrigin')?.toString().trim() || undefined,
    breederNameExternal: formData.get('breederNameExternal')?.toString().trim() || undefined,
    breedingRelationship: formData.get('breedingRelationship') ?? 'unknown',
    originNotes: formData.get('originNotes')?.toString().trim() || undefined,
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }

  const result = await updateRooster(profile.id, parsed.data)
  if (result.error) return { error: result.error }

  revalidatePath('/dashboard/roosters')
  revalidatePath(`/dashboard/roosters/${parsed.data.roosterId}`)
  return { success: 'Rooster updated' }
}
