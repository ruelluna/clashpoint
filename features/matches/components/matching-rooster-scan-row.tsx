'use client'

import { Button, Flex, Input, Text } from '@chakra-ui/react'
import { useCallback, useState } from 'react'

import { OwnerBarcodeScannerDialog } from '@/features/entries/components/owner-barcode-scanner-dialog'
import { lookupRoosterForMatchingAction } from '@/features/matches/actions'
import type { EligibleRooster } from '@/features/matches/types'
import { useBarcodeScanInput } from '@/hooks/use-barcode-scan-input'

type MatchingRoosterScanRowProps = {
  eventId: string
  label: string
  onResolved: (rooster: EligibleRooster) => void
  disabled?: boolean
}

export function MatchingRoosterScanRow({
  eventId,
  label,
  onResolved,
  disabled = false,
}: MatchingRoosterScanRowProps) {
  const [scanError, setScanError] = useState<string | null>(null)
  const [scannerOpen, setScannerOpen] = useState(false)

  const handleSubmit = useCallback(
    async (rawBarcode: string) => {
      const result = await lookupRoosterForMatchingAction(eventId, rawBarcode)

      if (result.error || !result.rooster) {
        setScanError(result.error ?? 'No eligible rooster found for this barcode')
        return 'error' as const
      }

      setScanError(null)
      onResolved(result.rooster)
      return 'success' as const
    },
    [eventId, onResolved]
  )

  const {
    inputRef,
    value,
    onChange,
    onKeyDown,
    onFocus,
    submitCurrent,
    submitRaw,
    pending,
  } = useBarcodeScanInput({
    onSubmit: handleSubmit,
    disabled,
  })

  return (
    <Flex direction="column" gap={2}>
      <Flex align="center" gap={3} direction={{ base: 'column', sm: 'row' }}>
        <Text fontSize="sm" fontWeight="medium" whiteSpace="nowrap" alignSelf={{ sm: 'center' }}>
          {label}
        </Text>
        <Input
          ref={inputRef}
          size="md"
          placeholder="Scan COCK barcode or type and press Enter"
          value={value}
          onChange={(event) => {
            onChange(event)
            if (scanError) setScanError(null)
          }}
          onKeyDown={onKeyDown}
          onFocus={onFocus}
          disabled={pending || disabled}
          data-testid={`matching-${label.toLowerCase()}-scan-input`}
        />
      </Flex>
      <Flex gap={2} wrap="wrap">
        <Button
          size="md"
          variant="outline"
          onClick={() => setScannerOpen(true)}
          disabled={pending || disabled}
        >
          Scan with camera
        </Button>
        <Button
          size="md"
          variant="outline"
          onClick={submitCurrent}
          loading={pending}
          disabled={!value.trim() || disabled}
        >
          Look up barcode
        </Button>
      </Flex>
      {scanError ? (
        <Text fontSize="sm" color="red.500">
          {scanError}
        </Text>
      ) : null}
      <OwnerBarcodeScannerDialog
        open={scannerOpen}
        onOpenChange={setScannerOpen}
        onScan={(barcode) => submitRaw(barcode)}
        title="Scan cock entry barcode"
        hint="Point the camera at the cock entry slip barcode."
      />
    </Flex>
  )
}
