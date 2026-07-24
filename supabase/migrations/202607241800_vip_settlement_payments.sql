-- VIP Palitada settlement: actionable obligations with paid tracking

alter type public.match_settlement_obligation_type add value if not exists 'vip_palitada_payout';
alter type public.match_settlement_obligation_type add value if not exists 'vip_palitada_collect';
alter type public.match_settlement_obligation_type add value if not exists 'vip_palitada_draw_refund';

alter type public.match_settlement_obligation_status add value if not exists 'paid';

alter table public.match_settlement_obligations
  add column if not exists paid_at timestamptz,
  add column if not exists paid_by uuid references auth.users (id) on delete set null,
  add column if not exists payment_id uuid references public.payments (id) on delete set null;

create index if not exists match_settlement_obligations_payment_id_idx
  on public.match_settlement_obligations (payment_id)
  where payment_id is not null;

-- Legacy info-only rows are replaced when obligations are regenerated on result record
delete from public.match_settlement_obligations
where obligation_type = 'vip_palitada_payout_info';
