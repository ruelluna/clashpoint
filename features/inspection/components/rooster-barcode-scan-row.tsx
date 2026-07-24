'use client'

import { Button, Flex, Input, Text } from '@chakra-ui/react'
import { useCallback, useState } from 'react'

import { OwnerBarcodeScannerDialog } from '@/features/entries/components/owner-barcode-scanner-dialog'
import { lookupRoosterByBarcodeAction } from '@/features/inspection/actions'
import { useBarcodeScanInput } from '@/hooks/use-barcode-scan-input'

type RoosterBarcodeScanRowProps = {
  eventId: string
  onResolved: (registrationId: string) => void
  disabled?: boolean
}

export function RoosterBarcodeScanRow({
  eventId,
  onResolved,
  disabled = false,
}: RoosterBarcodeScanRowProps) {
  const [scanError, setScanError] = useState<string | null>(null)
  const [scannerOpen, setScannerOpen] = useState(false)

  const handleSubmit = useCallback(
    async (rawBarcode: string) => {
      const result = await lookupRoosterByBarcodeAction(eventId, rawBarcode)

      if (result.error || !result.registrationId) {
        setScanError(result.error ?? 'No rooster found for this barcode')
        return 'error' as const
      }

      setScanError(null)
      onResolved(result.registrationId)
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
          Scan
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
          data-testid="inspection-rooster-scan-input"
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
        hint="Point the camera at the cock entry slip barcode. Scanning stops after a successful read."
      />
    </Flex>
  )
}
