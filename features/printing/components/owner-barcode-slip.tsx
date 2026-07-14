'use client'

import { Stack, Text } from '@chakra-ui/react'

import { computeRegistrationAmountDue, type EventFeeSettings } from '@/features/events/fee-utils'
import { BarcodeLabel } from '@/features/printing/components/barcode-label'
import { PrintSlipLayout } from '@/features/printing/components/print-slip-layout'
import { usePrintFormat } from '@/features/printing/print-format-context'

type OwnerBarcodeSlipProps = {
  eventName: string
  entryNumber: string
  ownerName: string
  handlerName?: string | null
  ownerBarcode: string
  feeSettings: EventFeeSettings
}

function OwnerBarcodeContent({
  entryNumber,
  ownerName,
  handlerName,
  ownerBarcode,
  registrationDue,
}: {
  entryNumber: string
  ownerName: string
  handlerName?: string | null
  ownerBarcode: string
  registrationDue: number
}) {
  const printFormat = usePrintFormat()
  const barcodeSize = printFormat === 'sticker' ? 'sticker' : 'default'

  return (
    <>
      <Stack gap={1} className="print-slip-only">
        <Text fontSize="2xl" fontWeight="bold" textAlign="center">
          OWNER
        </Text>
        <Text fontSize="sm">Entry #{entryNumber}</Text>
        <Text fontWeight="semibold">{ownerName}</Text>
        {handlerName ? (
          <Text fontSize="sm" color="fg.muted">
            Handler: {handlerName}
          </Text>
        ) : null}
        {registrationDue > 0 ? (
          <Text fontSize="sm">Registration fee due: ₱{registrationDue.toFixed(2)}</Text>
        ) : null}
      </Stack>

      <Stack gap={1} className="print-sticker-only">
        <Text className="print-sticker-line" fontWeight="semibold">
          #{entryNumber} · {ownerName}
        </Text>
        {handlerName ? (
          <Text className="print-sticker-line" color="fg.muted">
            {handlerName}
          </Text>
        ) : null}
      </Stack>

      <BarcodeLabel value={ownerBarcode} size={barcodeSize} />
    </>
  )
}

export function OwnerBarcodeSlip({
  eventName,
  entryNumber,
  ownerName,
  handlerName,
  ownerBarcode,
  feeSettings,
}: OwnerBarcodeSlipProps) {
  const registrationDue = computeRegistrationAmountDue(feeSettings)

  return (
    <PrintSlipLayout title="Owner registration" eventName={eventName}>
      <OwnerBarcodeContent
        entryNumber={entryNumber}
        ownerName={ownerName}
        handlerName={handlerName}
        ownerBarcode={ownerBarcode}
        registrationDue={registrationDue}
      />
    </PrintSlipLayout>
  )
}
