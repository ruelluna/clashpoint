import 'server-only'

import { createClient } from '@/lib/supabase/server'

type SupabaseClient = Awaited<ReturnType<typeof createClient>>
type FromBuilder = ReturnType<SupabaseClient['from']>

export type ExtendedSupabaseClient = Omit<SupabaseClient, 'from'> & {
  from(relation: string): FromBuilder
}

export async function createExtendedClient(): Promise<ExtendedSupabaseClient> {
  return (await createClient()) as ExtendedSupabaseClient
}
