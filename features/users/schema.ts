import { z } from 'zod'

import type { AppRole } from '@/lib/auth/types'

export const appRoleSchema = z.enum([
  'admin',
  'system_owner',
  'event_organizer',
  'registration_staff',
  'finance_staff',
  'weighing_staff',
  'matchmaker',
  'result_recorder',
  'promoter',
  'public_viewer',
])

export const inviteUserSchema = z.object({
  email: z.string().email('Valid email required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  displayName: z.string().min(1).max(100).optional(),
  role: appRoleSchema.exclude(['admin']),
})

export const updateUserRoleSchema = z.object({
  userId: z.string().uuid(),
  role: appRoleSchema,
  reason: z.string().min(3).optional(),
})

export const deactivateUserSchema = z.object({
  userId: z.string().uuid(),
  reason: z.string().min(3),
})

export type InviteUserInput = z.infer<typeof inviteUserSchema>
export type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>
export type DeactivateUserInput = z.infer<typeof deactivateUserSchema>

export const ROLE_LABELS: Record<AppRole, string> = {
  admin: 'Admin (legacy)',
  system_owner: 'System Owner',
  event_organizer: 'Event Organizer',
  registration_staff: 'Registration Staff',
  finance_staff: 'Finance Staff',
  weighing_staff: 'Weighing Staff',
  matchmaker: 'Matchmaker',
  result_recorder: 'Result Recorder',
  promoter: 'Promoter',
  public_viewer: 'Public Viewer',
}
