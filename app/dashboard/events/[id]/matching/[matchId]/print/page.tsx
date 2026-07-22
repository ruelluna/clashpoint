import { EventPageLayout } from '@/components/dashboard/event-page-layout'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { getEvent } from '@/features/events/queries'
import { getMatchById } from '@/features/matches/queries'
import { MatchBetPrintSheet } from '@/features/printing/components/match-bet-barcode-slip'
import { PageStack } from '@/components/dashboard'
import { Button } from '@chakra-ui/react'
import { requirePermission } from '@/lib/auth/permissions'

type MatchBetPrintPageProps = {
  params: Promise<{ id: string; matchId: string }>
}

export default async function MatchBetPrintPage({ params }: MatchBetPrintPageProps) {
  await requirePermission('matches.manage')
  const { id, matchId } = await params
  const event = await getEvent(id)

  if (!event) notFound()

  const match = await getMatchById(id, matchId)
  if (!match) notFound()
  if (!match.meron.bet_barcode || !match.wala.bet_barcode) notFound()

  return (
    <EventPageLayout eventId={event.id} eventName={event.name}>
      <PageStack maxW="md">
        <MatchBetPrintSheet
          eventName={event.name}
          meron={{
            fightNumber: match.fight_number,
            matchingNumber: match.matching_number ?? undefined,
            entryNumber: match.meron.entry_number,
            entryName: match.meron.entry_name,
            ownerName: match.meron.owner_name,
            cockNumber: match.meron.cock_number,
            bandNumber: match.meron.band_number,
            betAmount: match.meron.bet_amount,
            betBarcode: match.meron.bet_barcode,
          }}
          wala={{
            fightNumber: match.fight_number,
            matchingNumber: match.matching_number ?? undefined,
            entryNumber: match.wala.entry_number,
            entryName: match.wala.entry_name,
            ownerName: match.wala.owner_name,
            cockNumber: match.wala.cock_number,
            bandNumber: match.wala.band_number,
            betAmount: match.wala.bet_amount,
            betBarcode: match.wala.bet_barcode,
          }}
        />
        <Button asChild variant="outline" alignSelf="flex-start" className="no-print">
          <Link href={`/dashboard/events/${id}/matching`}>Back to matching</Link>
        </Button>
      </PageStack>
    </EventPageLayout>
  )
}
