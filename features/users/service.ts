import 'server-only'

import { writeAuditLog } from '@/features/audit/service'
import type {
  DeactivateUserInput,
  InviteUserInput,
  UpdateUserModulesInput,
  UpdateUserRoleInput,
} from '@/features/users/schema'
import {
  modulesToPermissions,
  permissionsToModules,
  type AccessModuleId,
} from '@/lib/auth/modules'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

async function replaceUserPermissions(
  userId: string,
  permissionIds: string[]
): Promise<{ error?: string }> {
  const supabase = await createClient()

  const { error: deleteError } = await supabase
    .from('user_permissions')
    .delete()
    .eq('user_id', userId)

  if (deleteError) {
    return { error: deleteError.message }
  }

  if (permissionIds.length === 0) {
    return {}
  }

  const { error: insertError } = await supabase.from('user_permissions').insert(
    permissionIds.map((permission_id) => ({
      user_id: userId,
      permission_id,
    }))
  )

  if (insertError) {
    return { error: insertError.message }
  }

  return {}
}

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

  if (input.role === 'staff') {
    const permissionResult = await replaceUserPermissions(
      created.user.id,
      modulesToPermissions(input.modules as AccessModuleId[])
    )

    if (permissionResult.error) {
      await admin.auth.admin.deleteUser(created.user.id)
      return { error: permissionResult.error }
    }
  }

  await writeAuditLog({
    actorId,
    action: 'user.invited',
    entityType: 'user',
    entityId: created.user.id,
    newValues: {
      email: input.email,
      role: input.role,
      modules: input.role === 'staff' ? input.modules : undefined,
    },
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

  if (input.role !== 'staff') {
    await supabase.from('user_permissions').delete().eq('user_id', input.userId)
  }

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

export async function updateUserModules(
  actorId: string,
  input: UpdateUserModulesInput
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: existing } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', input.userId)
    .single()

  if (!existing) return { error: 'User not found' }
  if (existing.role !== 'staff') {
    return { error: 'Modules can only be updated for staff users' }
  }

  const { data: currentPermissions } = await supabase
    .from('user_permissions')
    .select('permission_id')
    .eq('user_id', input.userId)

  const oldModules = permissionsToModules(
    (currentPermissions ?? []).map((row) => row.permission_id)
  )

  const permissionResult = await replaceUserPermissions(
    input.userId,
    modulesToPermissions(input.modules as AccessModuleId[])
  )

  if (permissionResult.error) {
    return permissionResult
  }

  await writeAuditLog({
    actorId,
    action: 'user.modules_updated',
    entityType: 'user',
    entityId: input.userId,
    oldValues: { modules: oldModules },
    newValues: { modules: input.modules },
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
