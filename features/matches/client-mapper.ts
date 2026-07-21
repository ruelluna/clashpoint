import type {
  MatchBetPaymentStatus,
  MatchListItem,
  MatchStatus,
  PalitadaContributorItem,
} from '@/features/matches/types'

export type ClientMatchQueryRow = {
  id: string
  event_id: string
  fight_number: number
  matching_number: string | null
  round_number: number | null
  status: MatchStatus
  queue_status: MatchListItem['queue_status']
  in_meron_odds: number | null
  in_wala_odds: number | null
  meron_weight: number | null
  wala_weight: number | null
  meron_entry: {
    id: string
    entry_number: string
    entry_name: string
    owner_name: string
  } | null
  wala_entry: {
    id: string
    entry_number: string
    entry_name: string
    owner_name: string
  } | null
  meron_rooster: {
    id: string
    cock_number: number
    band_number: string
  } | null
  wala_rooster: {
    id: string
    cock_number: number
    band_number: string
  } | null
}

type BetRow = {
  side: 'meron' | 'wala'
  amount: number
  collected_amount: number
  barcode: string
  payment_status: MatchBetPaymentStatus
}

type PalitadaRow = {
  side: 'meron' | 'wala'
  id: string
  contributor_name: string
  contributor_type: 'vip' | 'monton'
  amount: number
}

export function mapMatchListItemFromQueryRow(
  row: ClientMatchQueryRow,
  bets: BetRow[],
  palitadaRows: PalitadaRow[]
): MatchListItem {
  const betsBySide: Record<
    'meron' | 'wala',
    {
      amount: number
      collected_amount: number
      barcode: string | null
      payment_status: MatchBetPaymentStatus
    }
  > = {
    meron: { amount: 0, collected_amount: 0, barcode: null, payment_status: 'unpaid' },
    wala: { amount: 0, collected_amount: 0, barcode: null, payment_status: 'unpaid' },
  }

  for (const bet of bets) {
    betsBySide[bet.side] = {
      amount: Number(bet.amount),
      collected_amount: Number(bet.collected_amount),
      barcode: bet.barcode,
      payment_status: bet.payment_status,
    }
  }

  const palitada = { meron: [] as PalitadaContributorItem[], wala: [] as PalitadaContributorItem[] }
  for (const contributor of palitadaRows) {
    const item: PalitadaContributorItem = {
      id: contributor.id,
      contributor_name: contributor.contributor_name,
      contributor_type: contributor.contributor_type,
      amount: Number(contributor.amount),
    }
    palitada[contributor.side].push(item)
  }

  return {
    id: row.id,
    event_id: row.event_id,
    fight_number: Number(row.fight_number),
    matching_number: row.matching_number,
    round_number: row.round_number != null ? Number(row.round_number) : null,
    status: row.status,
    queue_status: row.queue_status,
    in_meron_odds: row.in_meron_odds != null ? Number(row.in_meron_odds) : null,
    in_wala_odds: row.in_wala_odds != null ? Number(row.in_wala_odds) : null,
    meron_palitada: palitada.meron,
    wala_palitada: palitada.wala,
    meron: {
      entry_id: row.meron_entry?.id ?? '',
      entry_number: row.meron_entry?.entry_number ?? '—',
      entry_name: row.meron_entry?.entry_name ?? '—',
      owner_name: row.meron_entry?.owner_name ?? '—',
      rooster_id: row.meron_rooster?.id ?? '',
      cock_number: Number(row.meron_rooster?.cock_number ?? 0),
      band_number: row.meron_rooster?.band_number ?? '—',
      weight: row.meron_weight != null ? Number(row.meron_weight) : null,
      bet_amount: betsBySide.meron.amount,
      bet_collected_amount: betsBySide.meron.collected_amount,
      bet_barcode: betsBySide.meron.barcode,
      bet_payment_status: betsBySide.meron.payment_status,
    },
    wala: {
      entry_id: row.wala_entry?.id ?? '',
      entry_number: row.wala_entry?.entry_number ?? '—',
      entry_name: row.wala_entry?.entry_name ?? '—',
      owner_name: row.wala_entry?.owner_name ?? '—',
      rooster_id: row.wala_rooster?.id ?? '',
      cock_number: Number(row.wala_rooster?.cock_number ?? 0),
      band_number: row.wala_rooster?.band_number ?? '—',
      weight: row.wala_weight != null ? Number(row.wala_weight) : null,
      bet_amount: betsBySide.wala.amount,
      bet_collected_amount: betsBySide.wala.collected_amount,
      bet_barcode: betsBySide.wala.barcode,
      bet_payment_status: betsBySide.wala.payment_status,
    },
  }
}
