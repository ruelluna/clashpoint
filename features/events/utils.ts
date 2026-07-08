import type { EventStatus } from '@/features/events/types'

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
