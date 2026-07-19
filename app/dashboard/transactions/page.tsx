import { GlobalTransactionsClient } from '@/features/transactions/components/global-transactions-client'
import { getActiveEvent, listEvents } from '@/features/events/queries'
import { listGlobalTransactionsForEvent } from '@/features/transactions/queries'
import type { GlobalTransactionKind } from '@/features/transactions/types'
import { getRevolvingFundBalance } from '@/features/revolving-fund/service'
import { requireSystemOwner } from '@/lib/auth/permissions'

type GlobalTransactionsPageProps = {
  searchParams: Promise<{ eventId?: string; kind?: string }>
}

function parseKind(value: string | undefined): GlobalTransactionKind | 'all' {
  const allowed: GlobalTransactionKind[] = [
    'payment',
    'refund',
    'opening_float',
    'admin_handover',
    'session_opened',
    'session_closed',
  ]

  if (!value || value === 'all') return 'all'
  return allowed.includes(value as GlobalTransactionKind)
    ? (value as GlobalTransactionKind)
    : 'all'
}

export default async function GlobalTransactionsPage({
  searchParams,
}: GlobalTransactionsPageProps) {
  await requireSystemOwner()
  const params = await searchParams
  const [events, activeEvent] = await Promise.all([listEvents(), getActiveEvent()])

  const selectedEventId = params.eventId ?? activeEvent?.id ?? null
  const selectedKind = parseKind(params.kind)
  const selectedEvent = events.find((event) => event.id === selectedEventId) ?? null

  const [transactions, revolvingFundBalance] = selectedEventId
    ? await Promise.all([
        listGlobalTransactionsForEvent(selectedEventId, { kind: selectedKind }),
        getRevolvingFundBalance(selectedEventId),
      ])
    : [[], 0]

  return (
    <GlobalTransactionsClient
        events={events}
        selectedEventId={selectedEventId}
        selectedEventName={selectedEvent?.name ?? activeEvent?.name ?? null}
        revolvingFundBalance={revolvingFundBalance}
        transactions={transactions}
        selectedKind={selectedKind}
    />
  )
}
