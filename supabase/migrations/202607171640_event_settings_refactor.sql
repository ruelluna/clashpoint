-- Event settings refactor: global inspection, tax commission, revolving fund ledger

create type public.revolving_fund_entry_type as enum ('opening', 'adjustment');

alter table public.events
  add column if not exists physical_inspection_required boolean not null default false,
  add column if not exists tax_commission numeric(12, 2) not null default 0,
  add column if not exists revolving_fund_initial numeric(12, 2) not null default 0;

-- Backfill inspection flag from derby eligibility policies
update public.events e
set physical_inspection_required = true
from public.derby_eligibility_policies p
where p.event_id = e.id
  and p.physical_inspection_required = true
  and 'inspection' = any(p.enabled_eligibility_fields);

create table public.event_revolving_fund_ledger (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  entry_type public.revolving_fund_entry_type not null,
  amount numeric(12, 2) not null,
  balance_after numeric(12, 2) not null,
  description text,
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now()
);

create index event_revolving_fund_ledger_event_id_created_at_idx
  on public.event_revolving_fund_ledger (event_id, created_at);

alter table public.event_revolving_fund_ledger enable row level security;

create policy "Staff can read revolving fund ledger"
  on public.event_revolving_fund_ledger for select to authenticated
  using (
    public.is_admin()
    or public.has_permission('payments.manage')
    or public.has_permission('events.manage')
    or public.has_permission('events.view')
  );

create policy "Finance can manage revolving fund ledger"
  on public.event_revolving_fund_ledger for all to authenticated
  using (
    public.is_admin()
    or public.has_permission('payments.manage')
    or public.has_permission('events.manage')
  )
  with check (
    public.is_admin()
    or public.has_permission('payments.manage')
    or public.has_permission('events.manage')
  );

grant select, insert, update, delete on public.event_revolving_fund_ledger to authenticated;
