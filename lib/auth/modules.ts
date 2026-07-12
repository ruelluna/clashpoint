export const ACCESS_MODULES = [
  {
    id: 'promoters',
    label: 'Promoters',
    permissions: ['promoters.manage'],
  },
  {
    id: 'events',
    label: 'Events',
    permissions: ['events.manage', 'events.view'],
  },
  {
    id: 'rooster-entries',
    label: 'Rooster Entries',
    permissions: ['entries.manage', 'weighing.manage', 'events.view'],
  },
  {
    id: 'matching',
    label: 'Matching & fight queue',
    permissions: ['matches.manage', 'events.view'],
  },
  {
    id: 'results',
    label: 'Results',
    permissions: ['results.manage', 'events.view'],
  },
  {
    id: 'standings',
    label: 'Standings',
    permissions: ['standings.view', 'events.view'],
  },
  {
    id: 'winners',
    label: 'Winners',
    permissions: ['winners.manage', 'events.view'],
  },
  {
    id: 'payouts',
    label: 'Payouts',
    permissions: ['payouts.manage', 'events.view'],
  },
  {
    id: 'settlements',
    label: 'Promoter settlements',
    permissions: ['settlements.manage', 'events.view'],
  },
  {
    id: 'reports',
    label: 'Reports',
    permissions: ['reports.view', 'events.view'],
  },
  {
    id: 'users',
    label: 'Users',
    permissions: ['users.manage', 'users.invite'],
  },
  {
    id: 'settings',
    label: 'Settings',
    permissions: ['settings.manage'],
  },
  {
    id: 'audit',
    label: 'Audit trail',
    permissions: ['audit.view'],
  },
] as const

export type AccessModuleId = (typeof ACCESS_MODULES)[number]['id']

export const ALL_MODULE_IDS = ACCESS_MODULES.map((m) => m.id) as AccessModuleId[]

const moduleById = new Map(ACCESS_MODULES.map((m) => [m.id, m]))

export function moduleToPermissions(moduleId: AccessModuleId): string[] {
  const mod = moduleById.get(moduleId)
  if (!mod) return []
  return [...mod.permissions]
}

export function modulesToPermissions(moduleIds: AccessModuleId[]): string[] {
  const keys = new Set<string>()
  for (const id of moduleIds) {
    for (const permission of moduleToPermissions(id)) {
      keys.add(permission)
    }
  }
  return [...keys]
}

export function permissionsToModules(permissionIds: string[]): AccessModuleId[] {
  const permissionSet = new Set(permissionIds)
  return ACCESS_MODULES.filter((mod) =>
    mod.permissions.every((permission) => permissionSet.has(permission))
  ).map((mod) => mod.id)
}

export function isAccessModuleId(value: string): value is AccessModuleId {
  return ALL_MODULE_IDS.includes(value as AccessModuleId)
}
