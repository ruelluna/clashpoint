import type { GlobalTransactionKind, GlobalTransactionRow } from '@/features/transactions/types'
import { CASHIER_SESSION_MOVEMENT_LABELS } from '@/features/cashier-sessions/schema'

export function globalTransactionKindLabel(kind: GlobalTransactionRow['kind']): string {
  switch (kind) {
    case 'payment':
      return 'Payment'
    case 'refund':
      return 'Refund'
    case 'opening_float':
      return CASHIER_SESSION_MOVEMENT_LABELS.opening_float
    case 'admin_handover':
      return CASHIER_SESSION_MOVEMENT_LABELS.admin_handover
    case 'session_opened':
      return 'Session opened'
    case 'session_closed':
      return 'Session closed'
    default:
      return kind
  }
}
