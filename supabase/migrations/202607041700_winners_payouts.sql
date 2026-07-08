create type public.settlement_status as enum ('pending', 'for_review', 'settled', 'disputed', 'cancelled');
create type public.payout_method as enum ('cash', 'bank_transfer', 'gcash', 'other');

create table public.event_finalizations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null unique references public.events (id) on delete cascade,
  finalized_by uuid references auth.users (id) on delete set null,
  finalized_at timestamptz not null default now(),
  is_locked boolean not null default true,
  champion_entry_ids uuid[] not null default '{}',
  notes text
);

create table public.prize_payouts (
  id uuid primary key default gen_random_uuid(),
  payout_reference text not null unique,
  event_id uuid not null references public.events (id) on delete cascade,
  entry_id uuid not null references public.entries (id),
  rank_label text not null,
  rank_position integer not null,
  amount numeric(12, 2) not null,
  payment_method public.payout_method,
  recipient_name text not null,
  released_by uuid references auth.users (id) on delete set null,
  released_at timestamptz,
  notes text,
  created_at timestamptz not null default now()
);

create table public.promoter_settlements (
  id uuid primary key default gen_random_uuid(),
  settlement_reference text not null unique,
  event_id uuid not null references public.events (id) on delete cascade,
  promoter_id uuid not null references public.promoters (id),
  gross_collection numeric(12, 2) not null default 0,
  eligible_collection numeric(12, 2) not null default 0,
  total_expenses numeric(12, 2) not null default 0,
  prize_pool numeric(12, 2) not null default 0,
  promoter_commission numeric(12, 2) not null default 0,
  promoter_advances numeric(12, 2) not null default 0,
  guaranteed_prize numeric(12, 2) not null default 0,
  amount_payable numeric(12, 2) not null default 0,
  amount_receivable numeric(12, 2) not null default 0,
  settlement_status public.settlement_status not null default 'pending',
  settled_by uuid references auth.users (id) on delete set null,
  settled_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.event_finalizations enable row level security;
alter table public.prize_payouts enable row level security;
alter table public.promoter_settlements enable row level security;

create policy "Staff can manage finalizations"
  on public.event_finalizations for all to authenticated
  using (public.is_admin() or public.has_permission('winners.manage'))
  with check (public.is_admin() or public.has_permission('winners.manage'));

create policy "Finance can manage payouts"
  on public.prize_payouts for all to authenticated
  using (public.is_admin() or public.has_permission('payouts.manage'))
  with check (public.is_admin() or public.has_permission('payouts.manage'));

create policy "Finance can manage settlements"
  on public.promoter_settlements for all to authenticated
  using (public.is_admin() or public.has_permission('settlements.manage'))
  with check (public.is_admin() or public.has_permission('settlements.manage'));

create policy "Promoter can read own settlements"
  on public.promoter_settlements for select to authenticated
  using (
    exists (
      select 1 from public.promoters p
      where p.id = promoter_id and p.user_id = auth.uid()
    )
  );

grant select, insert, update, delete on public.event_finalizations to authenticated;
grant select, insert, update, delete on public.prize_payouts to authenticated;
grant select, insert, update, delete on public.promoter_settlements to authenticated;
