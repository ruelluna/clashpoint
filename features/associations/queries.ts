import 'server-only'

import { createExtendedClient } from '@/lib/supabase/extended'

export type AssociationListItem = {
  id: string
  name: string
  code: string | null
}

export async function listAssociations(): Promise<AssociationListItem[]> {
  const supabase = await createExtendedClient()
  const { data } = await supabase
    .from('associations')
    .select('id, name, code')
    .is('deleted_at', null)
    .order('name')

  return (data ?? []) as AssociationListItem[]
}
