'use client'

import { Button, Flex, Input, Text } from '@chakra-ui/react'
import { useCallback, useRef, useState } from 'react'

import { OwnerBarcodeScannerDialog } from '@/features/entries/components/owner-barcode-scanner-dialog'
import { lookupRoosterByBarcodeAction } from '@/features/inspection/actions'

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
  const scanInputRef = useRef<HTMLInputElement>(null)
  const [scanValue, setScanValue] = useState('')
  const [scanError, setScanError] = useState<string | null>(null)
  const [scanPending, setScanPending] = useState(false)
  const [scannerOpen, setScannerOpen] = useState(false)

  const resolveBarcode = useCallback(
    async (rawBarcode: string) => {
      const trimmed = rawBarcode.trim()
      if (!trimmed) {
        setScanError('Enter a barcode to scan')
        return
      }

      setScanPending(true)
      setScanError(null)

      const result = await lookupRoosterByBarcodeAction(eventId, trimmed)
      setScanPending(false)

      if (result.error || !result.registrationId) {
        setScanError(result.error ?? 'No rooster found for this barcode')
        scanInputRef.current?.select()
        return
      }

      setScanValue('')
      onResolved(result.registrationId)
    },
    [eventId, onResolved]
  )

  async function handleScanKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key !== 'Enter') return
    event.preventDefault()
    await resolveBarcode(scanValue)
  }

  return (
    <Flex direction="column" gap={2}>
      <Flex align="center" gap={3} direction={{ base: 'column', sm: 'row' }}>
        <Text fontSize="sm" fontWeight="medium" whiteSpace="nowrap" alignSelf={{ sm: 'center' }}>
          Scan
        </Text>
        <Input
          ref={scanInputRef}
          size="md"
          placeholder="Scan COCK barcode or type and press Enter"
          value={scanValue}
          onChange={(event) => {
            setScanValue(event.target.value)
            if (scanError) setScanError(null)
          }}
          onKeyDown={handleScanKeyDown}
          disabled={scanPending || disabled}
          data-testid="inspection-rooster-scan-input"
        />
      </Flex>
      <Flex gap={2} wrap="wrap">
        <Button
          size="md"
          variant="outline"
          onClick={() => setScannerOpen(true)}
          disabled={scanPending || disabled}
        >
          Scan with camera
        </Button>
        <Button
          size="md"
          variant="outline"
          onClick={() => void resolveBarcode(scanValue)}
          loading={scanPending}
          disabled={!scanValue.trim() || disabled}
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
        onScan={(barcode) => void resolveBarcode(barcode)}
        title="Scan cock entry barcode"
        hint="Point the camera at the cock entry slip barcode. Scanning stops after a successful read."
      />
    </Flex>
  )
}
