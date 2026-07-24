'use client'

import { Button, Flex, Input, Text } from '@chakra-ui/react'
import { useCallback, useRef, useState } from 'react'

import { lookupOwnerEntryByBarcodeAction } from '@/features/entries/actions'
import { OwnerBarcodeScannerDialog } from '@/features/entries/components/owner-barcode-scanner-dialog'

type OwnerBarcodeScanRowProps = {
  eventId: string
  onResolved: (entryId: string) => void
  maxW?: string
}

export function OwnerBarcodeScanRow({
  eventId,
  onResolved,
  maxW = '2xl',
}: OwnerBarcodeScanRowProps) {
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

      const result = await lookupOwnerEntryByBarcodeAction(eventId, trimmed)
      setScanPending(false)

      if (result.error || !result.entryId) {
        setScanError(result.error ?? 'No owner found for this barcode')
        scanInputRef.current?.select()
        return
      }

      setScanValue('')
      onResolved(result.entryId)
    },
    [eventId, onResolved]
  )

  async function handleScanKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key !== 'Enter') return
    event.preventDefault()
    await resolveBarcode(scanValue)
  }

  return (
    <Flex direction="column" gap={2} maxW={maxW}>
      <Flex align="center" gap={3}>
        <Text fontSize="sm" fontWeight="medium" whiteSpace="nowrap">
          Scan
        </Text>
        <Input
          ref={scanInputRef}
          size="sm"
          placeholder="Scan OWNER barcode or type and press Enter"
          value={scanValue}
          onChange={(event) => {
            setScanValue(event.target.value)
            if (scanError) setScanError(null)
          }}
          onKeyDown={handleScanKeyDown}
          disabled={scanPending}
          data-testid="owner-barcode-scan-input"
        />
      </Flex>
      <Flex gap={2} wrap="wrap">
        <Button
          size="sm"
          variant="outline"
          onClick={() => setScannerOpen(true)}
          disabled={scanPending}
        >
          Scan with camera
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => void resolveBarcode(scanValue)}
          loading={scanPending}
          disabled={!scanValue.trim()}
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
      />
    </Flex>
  )
}
