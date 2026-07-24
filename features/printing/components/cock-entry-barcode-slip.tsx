'use client'

import { Stack, Text } from '@chakra-ui/react'

import { resolveCockScanCode } from '@/features/entries/schema'
import { BarcodeLabel } from '@/features/printing/components/barcode-label'
import { CompactBarcodeLabelBody } from '@/features/printing/components/compact-barcode-label-body'
import { PrintFormatSection } from '@/features/printing/components/print-format-section'
import { PrintSlipLayout } from '@/features/printing/components/print-slip-layout'
import { formatCockStickerHeadline } from '@/features/printing/format-compact-label-line'

type CockEntryBarcodeSlipProps = {
  eventName: string
  entryNumber: string
  ownerName: string
  entryName: string
  bandNumber: string
  cockEntryBarcode: string
  cockScanCode?: string | null
}

function CockBarcodeContent({
  entryNumber,
  ownerName,
  entryName,
  bandNumber,
  cockEntryBarcode,
  cockScanCode,
}: CockEntryBarcodeSlipProps) {
  const stickerHeadline = formatCockStickerHeadline(bandNumber)
  const stickerCode =
    resolveCockScanCode(cockEntryBarcode, cockScanCode) ?? cockEntryBarcode

  return (
    <>
      <PrintFormatSection when="slip">
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
          <BarcodeLabel value={stickerCode} size="default" />
        </Stack>
      </PrintFormatSection>

      <PrintFormatSection when="sticker">
        <CompactBarcodeLabelBody headline={stickerHeadline} barcode={stickerCode} />
      </PrintFormatSection>
    </>
  )
}

export function CockEntryBarcodeSlip(props: CockEntryBarcodeSlipProps) {
  return (
    <PrintSlipLayout title="Cock entry" eventName={props.eventName} labelSizedSlip>
      <CockBarcodeContent {...props} />
    </PrintSlipLayout>
  )
}
