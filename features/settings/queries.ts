import 'server-only'

import type { SystemSettings } from '@/features/settings/schema'
import { createClient } from '@/lib/supabase/server'

export async function getSystemSettings(): Promise<SystemSettings> {
  const supabase = await createClient()
  const { data, error } = await supabase.from('system_settings').select('key, value')

  if (error) throw error

  const map = Object.fromEntries(
    (data ?? []).map((row) => [row.key, row.value])
  )

  return {
    orgName: (map.org_name as string) ?? 'ClashPoint',
    defaultVenue: (map.default_venue as string) ?? 'Main Arena',
    legalDisclaimer:
      (map.legal_disclaimer as string) ??
      'This platform is for licensed and legally authorized derby operators only.',
    termsAccepted: (map.terms_accepted as boolean) ?? false,
    allowPublicBreedAdd: (map.allow_public_breed_add as boolean | undefined) ?? true,
    allowPublicColorAdd: (map.allow_public_color_add as boolean | undefined) ?? true,
  }
}
