import { ACCESS_MODULES, type AccessModuleId } from '@/lib/auth/modules'

export const MODULE_PAGE_ACCESS_IDS = [
  'promoters',
  'events',
  'rooster-registry',
  'registration-review',
  'derby-eligibility',
  'classification',
  'banding',
  'reports',
  'users',
  'settings',
  'audit',
] as const satisfies readonly AccessModuleId[]

export const MODULE_EVENT_TAB_ACCESS_IDS = [
  'derby-owner-registration',
  'derby-weighing',
  'rooster-entries',
  'inspection',
  'derby-payments',
  'bet-balancing',
  'matching',
  'results',
  'standings',
  'winners',
  'payouts',
  'settlements',
] as const satisfies readonly AccessModuleId[]

const moduleById = new Map(ACCESS_MODULES.map((mod) => [mod.id, mod]))

export function getModuleById(id: AccessModuleId) {
  return moduleById.get(id)
}

export function getPageAccessModules() {
  return MODULE_PAGE_ACCESS_IDS.map((id) => getModuleById(id)!)
}

export function getEventTabAccessModules() {
  return MODULE_EVENT_TAB_ACCESS_IDS.map((id) => getModuleById(id)!)
}
