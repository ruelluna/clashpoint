import { getSystemSettings } from '@/features/settings/queries'
import { SettingsPageClient } from '@/features/settings/components/settings-page-client'
import { getRoosterEntryCatalog } from '@/features/reference-values/catalog'
import { requirePermission } from '@/lib/auth/permissions'

export default async function SettingsPage() {
  await requirePermission('settings.manage')
  const [settings, catalog] = await Promise.all([
    getSystemSettings(),
    getRoosterEntryCatalog(),
  ])

  return <SettingsPageClient settings={settings} catalog={catalog} />
}
