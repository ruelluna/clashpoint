'use client'

import { Stack, Text } from '@chakra-ui/react'

import { FIGHT_SIDE_LABELS } from '@/features/matches/schema'
import { BarcodeLabel } from '@/features/printing/components/barcode-label'
import { PrintSlipLayout } from '@/features/printing/components/print-slip-layout'
import { usePrintFormat } from '@/features/printing/print-format-context'

type MatchBetBarcodeSlipProps = {
  eventName: string
  fightNumber: number
  side: 'meron' | 'wala'
  entryNumber: string
  entryName: string
  ownerName: string
  cockNumber: number
  bandNumber: string
  betAmount: number
  betBarcode: string
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'PHP',
  }).format(amount)
}

function MatchBetSlipContent(props: MatchBetBarcodeSlipProps) {
  const printFormat = usePrintFormat()
  const barcodeSize = printFormat === 'sticker' ? 'sticker' : 'default'

  return (
    <>
      <Stack gap={1} className="print-slip-only">
        <Text fontSize="2xl" fontWeight="bold" textAlign="center">
          PALITADA
        </Text>
        <Text fontSize="sm" textAlign="center" fontWeight="semibold">
          Fight #{props.fightNumber} · {FIGHT_SIDE_LABELS[props.side]}
        </Text>
        <Text fontSize="sm">
          Entry #{props.entryNumber} · {props.ownerName}
        </Text>
        <Text fontWeight="semibold">{props.entryName}</Text>
        <Text fontSize="sm" color="fg.muted">
          Cock #{props.cockNumber} · Band {props.bandNumber}
        </Text>
        <Text fontSize="lg" fontWeight="bold">
          Due: {formatCurrency(props.betAmount)}
        </Text>
      </Stack>

      <Stack gap={1} className="print-sticker-only">
        <Text className="print-sticker-line" fontWeight="semibold">
          #{props.fightNumber} {FIGHT_SIDE_LABELS[props.side]}
        </Text>
        <Text className="print-sticker-line">{formatCurrency(props.betAmount)}</Text>
      </Stack>

      <BarcodeLabel value={props.betBarcode} size={barcodeSize} />
    </>
  )
}

export function MatchBetBarcodeSlip(props: MatchBetBarcodeSlipProps) {
  return (
    <PrintSlipLayout
      title={`Palitada — ${FIGHT_SIDE_LABELS[props.side]}`}
      eventName={props.eventName}
    >
      <MatchBetSlipContent {...props} />
    </PrintSlipLayout>
  )
}

export function MatchBetPrintSheet({
  eventName,
  meron,
  wala,
}: {
  eventName: string
  meron: Omit<MatchBetBarcodeSlipProps, 'eventName' | 'side'>
  wala: Omit<MatchBetBarcodeSlipProps, 'eventName' | 'side'>
}) {
  return (
    <Stack gap={8} className="print-sheet">
      <MatchBetBarcodeSlip eventName={eventName} side="meron" {...meron} />
      <MatchBetBarcodeSlip eventName={eventName} side="wala" {...wala} />
    </Stack>
  )
}
