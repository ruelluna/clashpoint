'use client'

import { Stack, Text } from '@chakra-ui/react'

import { computeRegistrationAmountDue, type EventFeeSettings } from '@/features/events/fee-utils'
import { resolveOwnerScanCode } from '@/features/entries/schema'
import { BarcodeLabel } from '@/features/printing/components/barcode-label'
import { CompactBarcodeLabelBody } from '@/features/printing/components/compact-barcode-label-body'
import { PrintFormatSection } from '@/features/printing/components/print-format-section'
import { PrintSlipLayout } from '@/features/printing/components/print-slip-layout'
import { formatOwnerStickerHeadline } from '@/features/printing/format-compact-label-line'

type OwnerBarcodeSlipProps = {
  eventName: string
  entryNumber: string
  ownerName: string
  contactFullName?: string | null
  contactDesignation?: string | null
  ownerBarcode: string
  ownerScanCode?: string | null
  feeSettings: EventFeeSettings
}

function OwnerBarcodeContent({
  entryNumber,
  ownerName,
  contactFullName,
  contactDesignation,
  ownerBarcode,
  ownerScanCode,
  registrationDue,
}: {
  entryNumber: string
  ownerName: string
  contactFullName?: string | null
  contactDesignation?: string | null
  ownerBarcode: string
  ownerScanCode?: string | null
  registrationDue: number
}) {
  const contactLine = [contactFullName, contactDesignation].filter(Boolean).join(' · ')
  const stickerHeadline = formatOwnerStickerHeadline(entryNumber, ownerName)
  const stickerCode =
    resolveOwnerScanCode(ownerBarcode, ownerScanCode) ?? ownerBarcode

  return (
    <>
      <PrintFormatSection when="slip">
        <Stack gap={1} className="print-slip-only">
          <Text fontSize="2xl" fontWeight="bold" textAlign="center">
            OWNER
          </Text>
          <Text fontSize="sm">Entry #{entryNumber}</Text>
          <Text fontWeight="semibold">{ownerName}</Text>
          {contactLine ? (
            <Text fontSize="sm" color="fg.muted">
              {contactLine}
            </Text>
          ) : null}
          {registrationDue > 0 ? (
            <Text fontSize="sm">Registration fee due: ₱{registrationDue.toFixed(2)}</Text>
          ) : null}
          <BarcodeLabel value={stickerCode} size="default" />
        </Stack>
      </PrintFormatSection>

      <PrintFormatSection when="sticker">
        <CompactBarcodeLabelBody headline={stickerHeadline} barcode={stickerCode} />
      </PrintFormatSection>
    </>
  )
}

export function OwnerBarcodeSlip({
  eventName,
  entryNumber,
  ownerName,
  contactFullName,
  contactDesignation,
  ownerBarcode,
  ownerScanCode,
  feeSettings,
}: OwnerBarcodeSlipProps) {
  const registrationDue = computeRegistrationAmountDue(feeSettings)

  return (
    <PrintSlipLayout title="Owner registration" eventName={eventName} labelSizedSlip>
      <OwnerBarcodeContent
        entryNumber={entryNumber}
        ownerName={ownerName}
        contactFullName={contactFullName}
        contactDesignation={contactDesignation}
        ownerBarcode={ownerBarcode}
        ownerScanCode={ownerScanCode}
        registrationDue={registrationDue}
      />
    </PrintSlipLayout>
  )
}
