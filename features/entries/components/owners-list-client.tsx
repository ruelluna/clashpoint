'use client'

import { Badge, Button, Flex, Input, Text } from '@chakra-ui/react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useMemo, useRef, useState } from 'react'

import { ButtonGroup } from '@/components/dashboard'
import { lookupOwnerEntryByBarcodeAction } from '@/features/entries/actions'
import { OwnerBarcodeScannerDialog } from '@/features/entries/components/owner-barcode-scanner-dialog'
import type { EntryListItem } from '@/features/entries/types'
import type { EventFeeSettings } from '@/features/events/fee-utils'
import type { EntryFeeSnapshot } from '@/features/events/fee-utils'
import { getOwnerRegistrationPaymentDisplay } from '@/features/payments/display-utils'

type OwnersListClientProps = {
  eventId: string
  eventType: string
  entries: EntryListItem[]
  eventFeeSettings: EventFeeSettings
}

export function OwnersListClient({
  eventId,
  eventType,
  entries,
  eventFeeSettings,
}: OwnersListClientProps) {
  const router = useRouter()
  const scanInputRef = useRef<HTMLInputElement>(null)
  const [search, setSearch] = useState('')
  const [scanValue, setScanValue] = useState('')
  const [scanError, setScanError] = useState<string | null>(null)
  const [scanPending, setScanPending] = useState(false)
  const [scannerOpen, setScannerOpen] = useState(false)

  const isDerby = eventType === 'derby'

  const filteredEntries = useMemo(() => {
    const trimmed = search.trim().toLowerCase()
    if (!trimmed) return entries

    return entries.filter((entry) => {
      const haystack = [
        entry.entry_number,
        entry.owner_name,
        entry.contact_full_name,
        entry.contact_designation,
        entry.contact_number,
        entry.email,
        entry.owner_barcode,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return haystack.includes(trimmed)
    })
  }, [entries, search])

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
      router.push(`/dashboard/events/${eventId}/owners/${result.entryId}`)
    },
    [eventId, router]
  )

  async function handleScanKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key !== 'Enter') return
    event.preventDefault()
    await resolveBarcode(scanValue)
  }

  if (entries.length === 0) {
    return <Text color="fg.muted">No owners registered yet.</Text>
  }

  return (
    <Flex direction="column" gap={4}>
      <Flex align="center" gap={3} maxW="md">
        <Text fontSize="sm" fontWeight="medium" whiteSpace="nowrap">
          Search
        </Text>
        <Input
          size="sm"
          placeholder="Filter by owner, contact, entry #, or barcode"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </Flex>

      {isDerby ? (
        <Flex direction="column" gap={2} maxW="md">
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
      ) : null}

      {filteredEntries.length === 0 ? (
        <Text color="fg.muted">No owners match this search.</Text>
      ) : (
        <Flex direction="column" gap={3}>
          {filteredEntries.map((entry) => {
            const feeSettings =
              entry.fee_snapshot != null
                ? (entry.fee_snapshot as unknown as EntryFeeSnapshot)
                : eventFeeSettings
            const paymentDisplay = getOwnerRegistrationPaymentDisplay(
              entry.payment_status,
              feeSettings
            )

            return (
              <Flex
                key={entry.id}
                justify="space-between"
                align={{ base: 'flex-start', md: 'center' }}
                direction={{ base: 'column', md: 'row' }}
                gap={2}
                borderWidth="1px"
                borderColor="border"
                rounded="md"
                p={3}
                _hover={{ borderColor: 'border.emphasized', bg: 'bg.subtle' }}
                transition="border-color 0.15s, background 0.15s"
              >
                <Flex direction="column" gap={1} flex="1" minW={0}>
                  <Link href={`/dashboard/events/${eventId}/owners/${entry.id}`}>
                    <Text
                      fontWeight="semibold"
                      _hover={{ textDecoration: 'underline' }}
                    >
                      #{entry.entry_number} {entry.owner_name}
                    </Text>
                  </Link>
                  {entry.contact_full_name ? (
                    <Text fontSize="sm" color="fg.muted">
                      Contact: {entry.contact_full_name}
                      {entry.contact_designation ? ` · ${entry.contact_designation}` : ''}
                    </Text>
                  ) : null}
                  {entry.contact_number ? (
                    <Text fontSize="sm" color="fg.muted">
                      {entry.contact_number}
                    </Text>
                  ) : null}
                  {entry.owner_barcode ? (
                    <Text fontSize="xs" color="fg.muted" fontFamily="mono">
                      {entry.owner_barcode}
                    </Text>
                  ) : null}
                  <Flex gap={2} wrap="wrap">
                    <Badge>{entry.rooster_count} cock(s)</Badge>
                    {paymentDisplay ? (
                      <Badge colorPalette={paymentDisplay.colorPalette}>
                        {paymentDisplay.label}
                      </Badge>
                    ) : null}
                  </Flex>
                </Flex>
                <ButtonGroup>
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/dashboard/events/${eventId}/owners/${entry.id}`}>View</Link>
                  </Button>
                  {isDerby && entry.owner_barcode ? (
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/dashboard/events/${eventId}/owners/${entry.id}/print`}>
                        Print OWNER slip
                      </Link>
                    </Button>
                  ) : null}
                </ButtonGroup>
              </Flex>
            )
          })}
        </Flex>
      )}
    </Flex>
  )
}
