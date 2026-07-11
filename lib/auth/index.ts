export { getProfileForUser } from '@/lib/auth/get-profile'
export { getProfile } from '@/lib/auth/queries'
export {
  canAccessDashboard,
  canAccessDashboardForProfile,
  canAccessPortal,
  getUserPermissionIds,
  hasAnyPermission,
  hasPermission,
  isSystemOwnerRole,
  requireDashboardAccess,
  requirePermission,
  requirePortalAccess,
} from '@/lib/auth/permissions'
export { requireAdmin } from '@/lib/auth/require-role'
export { getUser, requireUser } from '@/lib/auth/session'
export type { AppRole, Profile } from '@/lib/auth/types'
