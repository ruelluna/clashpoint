import type { Database } from '@/lib/supabase/database.types'

export type ReferenceValueKind = Database['public']['Enums']['reference_value_kind']

export type ReferenceValueRow = Database['public']['Tables']['reference_values']['Row']

export type ReferenceValueSearchResult = {
  id: string
  name: string
}

export type ReferenceValueListItem = ReferenceValueSearchResult
