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
  if (derbyType == null) return 2
  if (derbyType === 'custom') return customValue ?? 2
  return COCKS_PER_ENTRY_BY_DERBY_TYPE[derbyType]
}

export const STATUS_TRANSITIONS: Record<EventStatus, EventStatus[]> = {
  draft: ['open', 'cancelled'],
  open: ['in_progress', 'cancelled'],
  in_progress: ['completed', 'cancelled'],
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

export function canActivateEvent(status: EventStatus): boolean {
  return status !== 'archived'
}

export function canEditEventDetails(status: EventStatus): boolean {
  return status === 'draft' || status === 'open'
}

export type RegistrationOpenEvent = {
  status: EventStatus
  registration_deadline: string | null
}

export function isRegistrationOpen(event: RegistrationOpenEvent): boolean {
  if (event.status !== 'open') return false
  if (event.registration_deadline == null) return true
  return new Date(event.registration_deadline).getTime() > Date.now()
}

export function getRegistrationClosedReason(
  event: RegistrationOpenEvent
): string {
  if (event.status !== 'open') {
    return 'Registration is not open for this event yet.'
  }
  if (
    event.registration_deadline != null &&
    new Date(event.registration_deadline).getTime() <= Date.now()
  ) {
    return 'The registration deadline for this event has passed.'
  }
  return 'Registration is closed for this event.'
}
