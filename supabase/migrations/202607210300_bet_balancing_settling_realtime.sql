-- Bet Balancing permission, match settling, settlement obligations, Realtime publication

insert into public.permissions (id, description)
values ('matches.palitada.manage', 'Record Palitada and use Bet Balancing pit')
on conflict (id) do nothing;

alter type public.match_status add value if not exists 'settling' before 'completed';

create type public.match_settlement_obligation_type as enum (
  'monton_palitada_stake',
  'monton_palitada_payout',
  'monton_palitada_draw_refund',
  'monton_house_earnings',
  'vip_palitada_payout_info'
);

create type public.match_settlement_obligation_status as enum ('pending', 'posted');

create table public.match_settlement_obligations (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches (id) on delete cascade,
  event_id uuid not null references public.events (id) on delete cascade,
  obligation_key text not null,
  obligation_type public.match_settlement_obligation_type not null,
  amount numeric(12, 2) not null,
  label text not null,
  description text,
  contributor_id uuid references public.match_palitada_contributions (id) on delete set null,
  requires_ledger_post boolean not null default true,
  status public.match_settlement_obligation_status not null default 'pending',
  ledger_entry_id uuid references public.event_revolving_fund_ledger (id) on delete set null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (match_id, obligation_key)
);

create index match_settlement_obligations_event_id_idx
  on public.match_settlement_obligations (event_id);

create index match_settlement_obligations_match_id_idx
  on public.match_settlement_obligations (match_id);

alter table public.match_pledge_settlements
  add column if not exists settled_at timestamptz,
  add column if not exists settled_by uuid references auth.users (id) on delete set null;

alter table public.event_revolving_fund_ledger
  add column if not exists source_match_id uuid references public.matches (id) on delete set null,
  add column if not exists obligation_key text;

create unique index if not exists event_revolving_fund_ledger_match_obligation_uidx
  on public.event_revolving_fund_ledger (source_match_id, obligation_key)
  where source_match_id is not null and obligation_key is not null;

drop policy if exists "Staff can read match palitada contributions"
  on public.match_palitada_contributions;

drop policy if exists "Staff can manage match palitada contributions"
  on public.match_palitada_contributions;

create policy "Staff can read match palitada contributions"
  on public.match_palitada_contributions for select to authenticated
  using (
    public.is_admin()
    or public.has_permission('matches.manage')
    or public.has_permission('matches.palitada.manage')
    or public.has_permission('events.view')
  );

create policy "Staff can manage match palitada contributions"
  on public.match_palitada_contributions for all to authenticated
  using (
    public.is_admin()
    or public.has_permission('matches.manage')
    or public.has_permission('matches.palitada.manage')
  )
  with check (
    public.is_admin()
    or public.has_permission('matches.manage')
    or public.has_permission('matches.palitada.manage')
  );

alter table public.match_settlement_obligations enable row level security;

create policy "Staff can read match settlement obligations"
  on public.match_settlement_obligations for select to authenticated
  using (
    public.is_admin()
    or public.has_permission('events.manage')
    or public.has_permission('matches.manage')
    or public.has_permission('events.view')
  );

create policy "Staff can manage match settlement obligations"
  on public.match_settlement_obligations for all to authenticated
  using (public.is_admin() or public.has_permission('events.manage') or public.has_permission('matches.manage'))
  with check (public.is_admin() or public.has_permission('events.manage') or public.has_permission('matches.manage'));

grant select, insert, update, delete on public.match_settlement_obligations to authenticated;

alter publication supabase_realtime add table public.match_palitada_contributions;
alter publication supabase_realtime add table public.match_bets;
alter publication supabase_realtime add table public.matches;
alter publication supabase_realtime add table public.match_settlement_obligations;
