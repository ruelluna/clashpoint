-- Cashier: typed revolving-fund posts linked to payments

alter type public.revolving_fund_entry_type add value if not exists 'collection';
alter type public.revolving_fund_entry_type add value if not exists 'refund';

alter table public.event_revolving_fund_ledger
  add column if not exists source_payment_id uuid references public.payments (id) on delete set null;

-- One collection and one refund row allowed per payment
create unique index if not exists event_revolving_fund_ledger_source_payment_type_uidx
  on public.event_revolving_fund_ledger (source_payment_id, entry_type)
  where source_payment_id is not null;
