alter table public.match_bets
  add column collected_amount numeric(12, 2) not null default 0;

update public.match_bets mb
set collected_amount = p.amount_paid
from public.payments p
where mb.payment_id = p.id
  and mb.payment_status = 'paid';
