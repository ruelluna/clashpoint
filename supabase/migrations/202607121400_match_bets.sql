create table public.match_bets (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches (id) on delete cascade,
  event_id uuid not null references public.events (id) on delete cascade,
  side public.fight_side not null,
  amount numeric(12, 2) not null default 0,
  recorded_by uuid references auth.users (id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (match_id, side)
);

alter table public.match_bets enable row level security;

create policy "Staff can read match bets"
  on public.match_bets for select to authenticated
  using (public.is_admin() or public.has_permission('matches.manage') or public.has_permission('events.view'));

create policy "Staff can manage match bets"
  on public.match_bets for all to authenticated
  using (public.is_admin() or public.has_permission('matches.manage'))
  with check (public.is_admin() or public.has_permission('matches.manage'));

grant select, insert, update, delete on public.match_bets to authenticated;
