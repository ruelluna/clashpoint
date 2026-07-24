'use client'

import { Stack, Text } from '@chakra-ui/react'

import { BarcodeLabel } from '@/features/printing/components/barcode-label'
import { usePrintFormat } from '@/features/printing/print-format-context'

type CompactBarcodeLabelBodyProps = {
  headline: string
  barcode: string
}

export function CompactBarcodeLabelBody({
  headline,
  barcode,
}: CompactBarcodeLabelBodyProps) {
  const format = usePrintFormat()
  if (format !== 'sticker') return null

  return (
    <Stack gap={0} className="print-sticker-only compact-barcode-label-body" width="100%">
      <Text
        className="print-sticker-headline"
        fontWeight="bold"
        fontSize="7pt"
        lineHeight="1.1"
        textAlign="center"
        whiteSpace="nowrap"
        overflow="hidden"
        textOverflow="ellipsis"
        width="100%"
      >
        {headline}
      </Text>
      <BarcodeLabel value={barcode} size="micro" />
      <Text
        className="print-sticker-code"
        fontSize="6pt"
        lineHeight="1.1"
        textAlign="center"
        whiteSpace="nowrap"
        overflow="hidden"
        textOverflow="ellipsis"
        width="100%"
      >
        {barcode}
      </Text>
    </Stack>
  )
}
