import 'server-only'

import { listReferenceValuesByKind } from '@/features/reference-values/queries'
import type { ReferenceValueSearchResult } from '@/features/reference-values/types'
import { createAdminClient } from '@/lib/supabase/admin'

export type RoosterEntryCatalog = {
  breeds: ReferenceValueSearchResult[]
  colors: ReferenceValueSearchResult[]
}

export type PublicReferenceOptions = {
  allowBreedAdd: boolean
  allowColorAdd: boolean
}

export async function getRoosterEntryCatalog(): Promise<RoosterEntryCatalog> {
  const admin = createAdminClient()
  const [breeds, colors] = await Promise.all([
    listReferenceValuesByKind('breed', admin),
    listReferenceValuesByKind('color_marking', admin),
  ])
  return { breeds, colors }
}

export async function getPublicReferenceOptions(): Promise<PublicReferenceOptions> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('system_settings')
    .select('key, value')
    .in('key', ['allow_public_breed_add', 'allow_public_color_add'])

  if (error) throw error

  const map = Object.fromEntries((data ?? []).map((row) => [row.key, row.value]))

  return {
    allowBreedAdd: (map.allow_public_breed_add as boolean | undefined) ?? true,
    allowColorAdd: (map.allow_public_color_add as boolean | undefined) ?? true,
  }
}
