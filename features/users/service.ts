import 'server-only'

import { writeAuditLog } from '@/features/audit/service'
import type {
  DeactivateUserInput,
  InviteUserInput,
  UpdateUserRoleInput,
} from '@/features/users/schema'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export async function inviteUser(
  actorId: string,
  input: InviteUserInput
): Promise<{ error?: string; userId?: string }> {
  const admin = createAdminClient()
  const { data: created, error: createError } = await admin.auth.admin.createUser(
    {
      email: input.email,
      password: input.password,
      email_confirm: true,
    }
  )

  if (createError || !created.user) {
    return { error: createError?.message ?? 'Failed to create user' }
  }

  const supabase = await createClient()
  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      role: input.role,
      display_name: input.displayName ?? null,
    })
    .eq('id', created.user.id)

  if (profileError) {
    await admin.auth.admin.deleteUser(created.user.id)
    return { error: 'Failed to assign role' }
  }

  await writeAuditLog({
    actorId,
    action: 'user.invited',
    entityType: 'user',
    entityId: created.user.id,
    newValues: { email: input.email, role: input.role },
  })

  return { userId: created.user.id }
}

export async function updateUserRole(
  actorId: string,
  input: UpdateUserRoleInput
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: existing } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', input.userId)
    .single()

  if (!existing) return { error: 'User not found' }

  const { error } = await supabase
    .from('profiles')
    .update({ role: input.role })
    .eq('id', input.userId)

  if (error) return { error: error.message }

  await writeAuditLog({
    actorId,
    action: 'user.role_updated',
    entityType: 'user',
    entityId: input.userId,
    oldValues: { role: existing.role },
    newValues: { role: input.role },
    reason: input.reason,
  })

  return {}
}

export async function deactivateUser(
  actorId: string,
  input: DeactivateUserInput
): Promise<{ error?: string }> {
  if (actorId === input.userId) {
    return { error: 'You cannot deactivate your own account' }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('profiles')
    .update({ is_active: false, deactivated_at: new Date().toISOString() })
    .eq('id', input.userId)

  if (error) return { error: error.message }

  await writeAuditLog({
    actorId,
    action: 'user.deactivated',
    entityType: 'user',
    entityId: input.userId,
    reason: input.reason,
  })

  return {}
}
