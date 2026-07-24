'use client'

import { Button, Flex, Input, Text } from '@chakra-ui/react'
import { useCallback, useState } from 'react'

import { lookupOwnerEntryByBarcodeAction } from '@/features/entries/actions'
import { OwnerBarcodeScannerDialog } from '@/features/entries/components/owner-barcode-scanner-dialog'
import { useBarcodeScanInput } from '@/hooks/use-barcode-scan-input'

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
  const [scanError, setScanError] = useState<string | null>(null)
  const [scannerOpen, setScannerOpen] = useState(false)

  const handleSubmit = useCallback(
    async (rawBarcode: string) => {
      const result = await lookupOwnerEntryByBarcodeAction(eventId, rawBarcode)

      if (result.error || !result.entryId) {
        setScanError(result.error ?? 'No owner found for this barcode')
        return 'error' as const
      }

      setScanError(null)
      onResolved(result.entryId)
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
  })

  return (
    <Flex direction="column" gap={2} maxW={maxW}>
      <Flex align="center" gap={3}>
        <Text fontSize="sm" fontWeight="medium" whiteSpace="nowrap">
          Scan
        </Text>
        <Input
          ref={inputRef}
          size="sm"
          placeholder="Scan OWNER barcode or type and press Enter"
          value={value}
          onChange={(event) => {
            onChange(event)
            if (scanError) setScanError(null)
          }}
          onKeyDown={onKeyDown}
          onFocus={onFocus}
          disabled={pending}
          data-testid="owner-barcode-scan-input"
        />
      </Flex>
      <Flex gap={2} wrap="wrap">
        <Button
          size="sm"
          variant="outline"
          onClick={() => setScannerOpen(true)}
          disabled={pending}
        >
          Scan with camera
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={submitCurrent}
          loading={pending}
          disabled={!value.trim()}
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
      />
    </Flex>
  )
}
