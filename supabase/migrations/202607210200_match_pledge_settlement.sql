create type public.palitada_contributor_type as enum ('vip', 'monton');

alter table public.matches
  add column if not exists in_meron_odds numeric(8, 2),
  add column if not exists in_wala_odds numeric(8, 2),
  add column if not exists pledge_settlement_snapshot jsonb;

create table public.match_palitada_contributions (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches (id) on delete cascade,
  event_id uuid not null references public.events (id) on delete cascade,
  side public.fight_side not null,
  contributor_name text not null,
  contributor_type public.palitada_contributor_type not null default 'vip',
  amount numeric(12, 2) not null check (amount > 0),
  recorded_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index match_palitada_contributions_match_id_idx
  on public.match_palitada_contributions (match_id);

create index match_palitada_contributions_event_id_idx
  on public.match_palitada_contributions (event_id);

alter table public.match_palitada_contributions enable row level security;

create policy "Staff can read match palitada contributions"
  on public.match_palitada_contributions for select to authenticated
  using (public.is_admin() or public.has_permission('matches.manage') or public.has_permission('events.view'));

create policy "Staff can manage match palitada contributions"
  on public.match_palitada_contributions for all to authenticated
  using (public.is_admin() or public.has_permission('matches.manage'))
  with check (public.is_admin() or public.has_permission('matches.manage'));

grant select, insert, update, delete on public.match_palitada_contributions to authenticated;

create table public.match_pledge_settlements (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches (id) on delete cascade,
  event_id uuid not null references public.events (id) on delete cascade,
  result_type public.fight_result_type not null,
  total_winning_pool numeric(12, 2) not null default 0,
  in_meron_odds numeric(8, 2),
  in_wala_odds numeric(8, 2),
  snapshot jsonb not null,
  recorded_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index match_pledge_settlements_match_id_idx
  on public.match_pledge_settlements (match_id);

create unique index match_pledge_settlements_match_id_key
  on public.match_pledge_settlements (match_id);

alter table public.match_pledge_settlements enable row level security;

create policy "Staff can read match pledge settlements"
  on public.match_pledge_settlements for select to authenticated
  using (public.is_admin() or public.has_permission('matches.manage') or public.has_permission('events.view'));

create policy "Staff can manage match pledge settlements"
  on public.match_pledge_settlements for all to authenticated
  using (public.is_admin() or public.has_permission('matches.manage'))
  with check (public.is_admin() or public.has_permission('matches.manage'));

grant select, insert, update, delete on public.match_pledge_settlements to authenticated;
