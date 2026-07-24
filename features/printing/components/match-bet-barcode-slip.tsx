'use client'

import { Stack, Text } from '@chakra-ui/react'

import { FIGHT_SIDE_LABELS, resolveMatchBetScanCode } from '@/features/matches/schema'
import { BarcodeLabel } from '@/features/printing/components/barcode-label'
import { CompactBarcodeLabelBody } from '@/features/printing/components/compact-barcode-label-body'
import { PrintFormatSection } from '@/features/printing/components/print-format-section'
import { PrintSlipLayout } from '@/features/printing/components/print-slip-layout'
import { formatPledgeStickerHeadline } from '@/features/printing/format-compact-label-line'

type MatchBetBarcodeSlipProps = {
  eventName: string
  fightNumber: number
  matchingNumber?: string | null
  side: 'meron' | 'wala'
  entryNumber: string
  entryName: string
  ownerName: string
  cockNumber: number
  bandNumber: string
  betAmount: number
  betBarcode: string
  betScanCode?: string | null
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'PHP',
  }).format(amount)
}

function MatchBetSlipContent(props: MatchBetBarcodeSlipProps) {
  const amountLabel = formatCurrency(props.betAmount)
  const stickerHeadline = formatPledgeStickerHeadline(
    props.fightNumber,
    FIGHT_SIDE_LABELS[props.side],
    amountLabel
  )
  const stickerCode =
    resolveMatchBetScanCode(props.betBarcode, props.betScanCode) ?? props.betBarcode

  return (
    <>
      <PrintFormatSection when="slip">
        <Stack gap={1} className="print-slip-only">
          <Text fontSize="2xl" fontWeight="bold" textAlign="center">
            PLEDGE
          </Text>
          <Text fontSize="sm" textAlign="center" fontWeight="semibold">
            Fight #{props.fightNumber} · {FIGHT_SIDE_LABELS[props.side]}
          </Text>
          {props.matchingNumber ? (
            <Text fontSize="xs" textAlign="center" color="fg.muted">
              {props.matchingNumber}
            </Text>
          ) : null}
          <Text fontSize="sm">
            Entry #{props.entryNumber} · {props.ownerName}
          </Text>
          <Text fontWeight="semibold">{props.entryName}</Text>
          <Text fontSize="sm" color="fg.muted">
            Cock #{props.cockNumber} · Band {props.bandNumber}
          </Text>
          <Text fontSize="lg" fontWeight="bold">
            Due: {amountLabel}
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

export function MatchBetBarcodeSlip(props: MatchBetBarcodeSlipProps) {
  return (
    <PrintSlipLayout
      title={`Pledge — ${FIGHT_SIDE_LABELS[props.side]}`}
      eventName={props.eventName}
      labelSizedSlip
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
