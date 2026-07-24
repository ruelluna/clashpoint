'use client'

import { Button, Stack, Text } from '@chakra-ui/react'
import Link from 'next/link'

import { eventFeeSettingsFromRow, type EventFeeSettings } from '@/features/events/fee-utils'
import { CockEntryBarcodeSlip } from '@/features/printing/components/cock-entry-barcode-slip'
import { OwnerBarcodeSlip } from '@/features/printing/components/owner-barcode-slip'
import type { PublicRegistrationRoosterBarcode } from '@/features/public/types'

export type PublicRegistrationBarcodesProps = {
  eventId: string
  eventName: string
  entryNumber: string
  ownerName: string
  ownerBarcode: string
  ownerScanCode?: string | null
  contactFullName?: string | null
  contactDesignation?: string | null
  roosters: PublicRegistrationRoosterBarcode[]
  feeSettings: EventFeeSettings
  showLabelsLink?: boolean
  showBackToEvent?: boolean
}

export function PublicRegistrationBarcodes({
  eventId,
  eventName,
  entryNumber,
  ownerName,
  ownerBarcode,
  ownerScanCode,
  contactFullName,
  contactDesignation,
  roosters,
  feeSettings,
  showLabelsLink = true,
  showBackToEvent = true,
}: PublicRegistrationBarcodesProps) {
  return (
    <Stack gap={6}>
      <Stack gap={2}>
        <Text fontSize="sm" color="fg.muted">
          Save or print these barcode slips. Staff may ask for them at inspection. You can
          reopen this page for about 30 minutes from this browser.
        </Text>
        {showLabelsLink ? (
          <Button asChild variant="outline" alignSelf="flex-start" className="no-print">
            <Link href={`/events/${eventId}/register/labels`}>Print / view labels</Link>
          </Button>
        ) : null}
      </Stack>

      <OwnerBarcodeSlip
        eventName={eventName}
        entryNumber={entryNumber}
        ownerName={ownerName}
        contactFullName={contactFullName}
        contactDesignation={contactDesignation}
        ownerBarcode={ownerBarcode}
        ownerScanCode={ownerScanCode}
        feeSettings={feeSettings}
      />

      {roosters.map((rooster) => (
        <CockEntryBarcodeSlip
          key={rooster.registrationId}
          eventName={eventName}
          entryNumber={entryNumber}
          ownerName={ownerName}
          entryName={rooster.entryName}
          bandNumber={rooster.bandNumber}
          cockEntryBarcode={rooster.cockEntryBarcode}
          cockScanCode={rooster.cockScanCode}
        />
      ))}

      {showBackToEvent ? (
        <Button asChild variant="outline" alignSelf="flex-start" className="no-print">
          <Link href={`/events/${eventId}`}>Back to event</Link>
        </Button>
      ) : null}
    </Stack>
  )
}

export function feeSettingsFromEntryFee(entryFee: number): EventFeeSettings {
  return eventFeeSettingsFromRow({ entry_fee: entryFee })
}
