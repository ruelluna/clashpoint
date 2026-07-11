'use server'

import { revalidatePath } from 'next/cache'

import { updateSettingsSchema } from '@/features/settings/schema'
import { updateSystemSettings } from '@/features/settings/service'
import { requirePermission } from '@/lib/auth/permissions'

export type SettingsActionState = { error?: string; success?: string }

export async function updateSettingsAction(
  _prev: SettingsActionState,
  formData: FormData
): Promise<SettingsActionState> {
  const profile = await requirePermission('settings.manage')

  const parsed = updateSettingsSchema.safeParse({
    orgName: formData.get('orgName'),
    defaultVenue: formData.get('defaultVenue'),
    legalDisclaimer: formData.get('legalDisclaimer'),
    termsAccepted: formData.get('termsAccepted') === 'on',
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid settings' }
  }

  const result = await updateSystemSettings(profile.id, parsed.data)
  if (result.error) return { error: result.error }

  revalidatePath('/dashboard/settings')
  return { success: 'Settings saved' }
}
