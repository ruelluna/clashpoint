import { PAYMENT_STATUS_LABELS } from '@/features/entries/schema'
import type { PaymentStatus } from '@/features/entries/types'
import type { EventFeeSettings } from '@/features/events/fee-utils'
import type { RegistrationPaymentStatus } from '@/lib/derby/enums'

export type PaymentDisplayBadge = {
  label: string
  colorPalette: 'gray' | 'green' | 'orange' | 'red'
}

export function getOwnerRegistrationPaymentDisplay(
  paymentStatus: PaymentStatus,
  settings: EventFeeSettings
): PaymentDisplayBadge {
  if (!settings.registrationFeeEnabled) {
    return { label: 'Not required', colorPalette: 'gray' }
  }

  return getEntryPaymentDisplay(paymentStatus)
}

export function getEntryPaymentDisplay(paymentStatus: PaymentStatus): PaymentDisplayBadge {
  if (paymentStatus === 'paid') {
    return { label: PAYMENT_STATUS_LABELS.paid, colorPalette: 'green' }
  }
  if (paymentStatus === 'partial') {
    return { label: PAYMENT_STATUS_LABELS.partial, colorPalette: 'orange' }
  }
  if (paymentStatus === 'refunded') {
    return { label: PAYMENT_STATUS_LABELS.refunded, colorPalette: 'red' }
  }
  return { label: PAYMENT_STATUS_LABELS.unpaid, colorPalette: 'orange' }
}

export function getRoosterEntryPaymentDisplay(
  regPaymentStatus: RegistrationPaymentStatus,
  settings: EventFeeSettings
): PaymentDisplayBadge {
  if (!settings.roosterEntryFeeEnabled || regPaymentStatus === 'not_required') {
    return { label: 'Not required', colorPalette: 'gray' }
  }

  if (regPaymentStatus === 'paid') {
    return { label: 'Paid', colorPalette: 'green' }
  }
  if (regPaymentStatus === 'partial') {
    return { label: 'Partial', colorPalette: 'orange' }
  }
  if (regPaymentStatus === 'refunded') {
    return { label: 'Refunded', colorPalette: 'red' }
  }
  return { label: 'Unpaid', colorPalette: 'orange' }
}

export function isOwnerRegistrationPaymentRequired(settings: EventFeeSettings): boolean {
  return settings.registrationFeeEnabled
}
