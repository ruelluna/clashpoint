import 'server-only'

import { writeAuditLog } from '@/features/audit/service'
import type { UpdateSettingsInput } from '@/features/settings/schema'
import { createClient } from '@/lib/supabase/server'

export async function updateSystemSettings(
  actorId: string,
  input: UpdateSettingsInput
): Promise<{ error?: string }> {
  const supabase = await createClient()

  const updates = [
    { key: 'org_name', value: input.orgName },
    { key: 'default_venue', value: input.defaultVenue },
    { key: 'legal_disclaimer', value: input.legalDisclaimer },
    { key: 'terms_accepted', value: input.termsAccepted },
  ]

  for (const { key, value } of updates) {
    const { error } = await supabase
      .from('system_settings')
      .update({ value, updated_by: actorId, updated_at: new Date().toISOString() })
      .eq('key', key)

    if (error) return { error: error.message }
  }

  await writeAuditLog({
    actorId,
    action: 'settings.updated',
    entityType: 'system_settings',
    entityId: actorId,
    newValues: input,
  })

  return {}
}
