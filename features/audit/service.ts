import 'server-only'

import type { Json } from '@/lib/supabase/database.types'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export type AuditLogInput = {
  actorId: string | null
  action: string
  entityType: string
  entityId: string
  oldValues?: Json | null
  newValues?: Json | null
  reason?: string
}

export async function writeAuditLog(
  input: AuditLogInput
): Promise<{ error?: string }> {
  const supabase =
    input.actorId == null ? createAdminClient() : await createClient()

  const newValues =
    input.reason && input.newValues
      ? { ...(input.newValues as Record<string, Json>), reason: input.reason }
      : input.reason
        ? { reason: input.reason }
        : input.newValues

  const { error } = await supabase.from('audit_logs').insert({
    actor_id: input.actorId,
    action: input.action,
    entity_type: input.entityType,
    entity_id: input.entityId,
    old_values: input.oldValues ?? null,
    new_values: newValues ?? null,
  })

  if (error) return { error: error.message }
  return {}
}
