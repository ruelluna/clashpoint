create type public.match_bet_payment_status as enum ('unpaid', 'paid', 'refunded', 'waived');

alter type public.payment_category add value if not exists 'match_bet';

alter table public.match_bets
  add column barcode text,
  add column payment_status public.match_bet_payment_status not null default 'unpaid',
  add column payment_id uuid references public.payments (id) on delete set null,
  add column printed_at timestamptz;

alter table public.payments
  add column match_bet_id uuid references public.match_bets (id) on delete set null,
  add column match_id uuid references public.matches (id) on delete set null,
  add column fight_side public.fight_side;

create index payments_match_bet_id_idx on public.payments (match_bet_id)
  where match_bet_id is not null;

create index match_bets_barcode_idx on public.match_bets (barcode)
  where barcode is not null;

create index match_bets_event_payment_status_idx
  on public.match_bets (event_id, payment_status);

-- Backfill barcodes for existing bets
update public.match_bets mb
set barcode = upper(
  'BET-'
  || substr(replace(m.event_id::text, '-', ''), 1, 8)
  || '-'
  || lpad(m.fight_number::text, 4, '0')
  || '-'
  || case mb.side when 'meron' then 'M' when 'wala' then 'W' end
)
from public.matches m
where mb.match_id = m.id
  and mb.barcode is null;

alter table public.match_bets
  alter column barcode set not null;

alter table public.match_bets
  add constraint match_bets_barcode_unique unique (barcode);
