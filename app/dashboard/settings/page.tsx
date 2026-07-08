import { getSystemSettings } from '@/features/settings/queries'
import { SettingsPageClient } from '@/features/settings/components/settings-page-client'
import { requirePermission } from '@/lib/auth/permissions'

export default async function SettingsPage() {
  await requirePermission('settings.manage')
  const settings = await getSystemSettings()

  return <SettingsPageClient settings={settings} />
}
