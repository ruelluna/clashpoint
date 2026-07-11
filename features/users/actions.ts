'use server'

import { revalidatePath } from 'next/cache'

import {
  deactivateUserSchema,
  inviteUserSchema,
  parseModulesFromFormData,
  updateUserModulesSchema,
  updateUserRoleSchema,
} from '@/features/users/schema'
import {
  deactivateUser,
  inviteUser,
  updateUserModules,
  updateUserRole,
} from '@/features/users/service'
import { requirePermission } from '@/lib/auth/permissions'

export type ActionState = { error?: string; success?: string }

export async function inviteUserAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const profile = await requirePermission('users.invite')

  const parsed = inviteUserSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
    displayName: formData.get('displayName')?.toString().trim() || undefined,
    role: formData.get('role'),
    modules: parseModulesFromFormData(formData),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }

  const result = await inviteUser(profile.id, parsed.data)
  if (result.error) return { error: result.error }

  revalidatePath('/dashboard/users')
  return { success: 'User invited successfully' }
}

export async function updateUserRoleAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const profile = await requirePermission('users.manage')

  const parsed = updateUserRoleSchema.safeParse({
    userId: formData.get('userId'),
    role: formData.get('role'),
    reason: formData.get('reason')?.toString().trim() || undefined,
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }

  const result = await updateUserRole(profile.id, parsed.data)
  if (result.error) return { error: result.error }

  revalidatePath('/dashboard/users')
  revalidatePath('/dashboard/audit')
  return { success: 'Role updated' }
}

export async function updateUserModulesAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const profile = await requirePermission('users.manage')

  const parsed = updateUserModulesSchema.safeParse({
    userId: formData.get('userId'),
    modules: parseModulesFromFormData(formData),
    reason: formData.get('reason')?.toString().trim() || undefined,
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }

  const result = await updateUserModules(profile.id, parsed.data)
  if (result.error) return { error: result.error }

  revalidatePath('/dashboard/users')
  revalidatePath('/dashboard/audit')
  return { success: 'Modules updated' }
}

export async function deactivateUserAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const profile = await requirePermission('users.manage')

  const parsed = deactivateUserSchema.safeParse({
    userId: formData.get('userId'),
    reason: formData.get('reason'),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }

  const result = await deactivateUser(profile.id, parsed.data)
  if (result.error) return { error: result.error }

  revalidatePath('/dashboard/users')
  return { success: 'User deactivated' }
}
