import { z } from 'zod'

import {
  isAccessModuleId,
  type AccessModuleId,
} from '@/lib/auth/modules'
import type { AppRole } from '@/lib/auth/types'

export const appRoleSchema = z.enum([
  'admin',
  'system_owner',
  'event_organizer',
  'promoter',
  'staff',
])

export const usersManageableRoleSchema = appRoleSchema.exclude(['admin', 'promoter'])

export type UsersManageableRole = z.infer<typeof usersManageableRoleSchema>

export const PROMOTER_CREATED_IN_PROMOTERS_MESSAGE =
  'Promoter accounts are created in Promoters (optional login there).'

export const moduleIdSchema = z
  .string()
  .refine(isAccessModuleId, 'Invalid module')

const modulesFieldSchema = z
  .array(moduleIdSchema)
  .optional()
  .transform((value) => value ?? [])

export const inviteUserSchema = z
  .object({
    email: z.string().email('Valid email required'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    displayName: z.string().min(1).max(100).optional(),
    role: usersManageableRoleSchema,
    modules: modulesFieldSchema,
  })
  .superRefine((data, ctx) => {
    if (data.role === 'staff' && data.modules.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Select at least one module for staff users',
        path: ['modules'],
      })
    }
  })

export const updateUserRoleSchema = z.object({
  userId: z.string().uuid(),
  role: usersManageableRoleSchema,
  reason: z.string().min(3).optional(),
})

export const updateUserModulesSchema = z.object({
  userId: z.string().uuid(),
  modules: z.array(moduleIdSchema).min(1, 'Select at least one module'),
  reason: z.string().min(3).optional(),
})

export const deactivateUserSchema = z.object({
  userId: z.string().uuid(),
  reason: z.string().min(3),
})

export type InviteUserInput = z.infer<typeof inviteUserSchema>
export type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>
export type UpdateUserModulesInput = z.infer<typeof updateUserModulesSchema>
export type DeactivateUserInput = z.infer<typeof deactivateUserSchema>

export const ROLE_LABELS: Record<AppRole, string> = {
  admin: 'Admin (legacy)',
  system_owner: 'System Owner',
  event_organizer: 'Event Organizer',
  promoter: 'Promoter',
  staff: 'Staff',
}

export function parseModulesFromFormData(formData: FormData): AccessModuleId[] {
  return formData
    .getAll('modules')
    .map((value) => value.toString())
    .filter(isAccessModuleId)
}
