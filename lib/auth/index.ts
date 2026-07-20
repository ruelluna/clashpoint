export { getProfileForUser } from '@/lib/auth/get-profile'
export { getProfile } from '@/lib/auth/queries'
export { canOperateAsStaff } from '@/lib/auth/operational-access'
export {
  canAccessDashboard,
  canAccessDashboardForProfile,
  canAccessPortal,
  getUserPermissionIds,
  hasAnyPermission,
  hasPermission,
  isSystemOwnerRole,
  requireDashboardAccess,
  requireOperationalPermission,
  requirePermission,
  requirePortalAccess,
  requireSystemOwner,
} from '@/lib/auth/permissions'
export {
  getPromoterAccessDeniedReason,
  resolvePromoterSignInAccess,
} from '@/lib/auth/promoter-access'
export { requireAdmin } from '@/lib/auth/require-role'
export { getUser, requireUser } from '@/lib/auth/session'
export type { AppRole, Profile } from '@/lib/auth/types'
