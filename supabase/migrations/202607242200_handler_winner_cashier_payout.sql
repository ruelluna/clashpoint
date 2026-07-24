-- Handler winner/draw payouts via Cashier; match settlement obligation types

alter type public.match_settlement_obligation_type add value if not exists 'handler_win_payout';
alter type public.match_settlement_obligation_type add value if not exists 'handler_draw_refund';

alter type public.payment_category add value if not exists 'match_bet_payout';

alter table public.match_bets
  add column if not exists payout_status public.match_bet_payment_status not null default 'unpaid',
  add column if not exists payout_payment_id uuid references public.payments (id) on delete set null;

create index if not exists match_bets_payout_payment_id_idx
  on public.match_bets (payout_payment_id)
  where payout_payment_id is not null;
