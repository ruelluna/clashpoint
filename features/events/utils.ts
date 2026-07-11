import type { DerbyType, EventStatus } from '@/features/events/types'

export const COCKS_PER_ENTRY_BY_DERBY_TYPE: Record<
  Exclude<DerbyType, 'custom'>,
  number
> = {
  '2_cock': 2,
  '3_cock': 3,
  '4_cock': 4,
  '5_cock': 5,
}

export function resolveCocksPerEntry(
  eventType: 'classic' | 'derby',
  derbyType: DerbyType | null | undefined,
  customValue?: number
): number {
  if (eventType === 'classic') return 1
  if (derbyType == null) return 5
  if (derbyType === 'custom') return customValue ?? 5
  return COCKS_PER_ENTRY_BY_DERBY_TYPE[derbyType]
}

export const STATUS_TRANSITIONS: Record<EventStatus, EventStatus[]> = {
  draft: ['open', 'cancelled'],
  open: ['registration_closed', 'cancelled'],
  registration_closed: ['ready_for_weighing', 'cancelled'],
  ready_for_weighing: ['ready_for_matching', 'cancelled'],
  ready_for_matching: ['ongoing', 'cancelled'],
  ongoing: ['completed', 'cancelled'],
  completed: ['archived'],
  cancelled: ['archived'],
  archived: [],
}

export function isValidStatusTransition(
  from: EventStatus,
  to: EventStatus
): boolean {
  if (from === to) return false
  return STATUS_TRANSITIONS[from]?.includes(to) ?? false
}

export function getNextStatuses(current: EventStatus): EventStatus[] {
  return STATUS_TRANSITIONS[current] ?? []
}

export function isTerminalStatus(status: EventStatus): boolean {
  return status === 'archived'
}

export function canEditEventDetails(status: EventStatus): boolean {
  return status === 'draft' || status === 'open'
}
