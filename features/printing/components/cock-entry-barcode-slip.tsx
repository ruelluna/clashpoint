'use client'

import { Stack, Text } from '@chakra-ui/react'

import { BarcodeLabel } from '@/features/printing/components/barcode-label'
import { PrintSlipLayout } from '@/features/printing/components/print-slip-layout'
import { usePrintFormat } from '@/features/printing/print-format-context'

type CockEntryBarcodeSlipProps = {
  eventName: string
  entryNumber: string
  ownerName: string
  entryName: string
  bandNumber: string
  cockEntryBarcode: string
}

function CockBarcodeContent({
  entryNumber,
  ownerName,
  entryName,
  bandNumber,
  cockEntryBarcode,
}: CockEntryBarcodeSlipProps) {
  const printFormat = usePrintFormat()
  const barcodeSize = printFormat === 'sticker' ? 'sticker' : 'default'

  return (
    <>
      <Stack gap={1} className="print-slip-only">
        <Text fontSize="2xl" fontWeight="bold" textAlign="center">
          COCK ENTRY
        </Text>
        <Text fontSize="sm">
          Entry #{entryNumber} · {ownerName}
        </Text>
        <Text fontWeight="semibold">{entryName}</Text>
        <Text fontSize="sm" color="fg.muted">
          Band: {bandNumber}
        </Text>
      </Stack>

      <Stack gap={1} className="print-sticker-only">
        <Text className="print-sticker-line" fontWeight="semibold">
          #{entryNumber} · Band {bandNumber}
        </Text>
        <Text className="print-sticker-line">{entryName}</Text>
      </Stack>

      <BarcodeLabel value={cockEntryBarcode} size={barcodeSize} />
    </>
  )
}

export function CockEntryBarcodeSlip(props: CockEntryBarcodeSlipProps) {
  return (
    <PrintSlipLayout title="Cock entry" eventName={props.eventName}>
      <CockBarcodeContent {...props} />
    </PrintSlipLayout>
  )
}
