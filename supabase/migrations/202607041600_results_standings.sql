create type public.fight_result_type as enum (
  'meron_win', 'wala_win', 'draw', 'no_contest', 'disqualification', 'cancelled'
);
create type public.result_status as enum ('draft', 'submitted', 'verified', 'final');
create type public.standing_status as enum ('active', 'eliminated', 'completed');

create table public.fight_results (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null unique references public.matches (id) on delete cascade,
  event_id uuid not null references public.events (id) on delete cascade,
  winning_side public.fight_side,
  result_type public.fight_result_type not null,
  winning_entry_id uuid references public.entries (id),
  losing_entry_id uuid references public.entries (id),
  result_status public.result_status not null default 'draft',
  recorded_by uuid references auth.users (id) on delete set null,
  verified_by uuid references auth.users (id) on delete set null,
  result_time timestamptz,
  notes text,
  under_protest boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.standings (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  entry_id uuid not null references public.entries (id) on delete cascade,
  total_fights integer not null default 0,
  wins integer not null default 0,
  losses integer not null default 0,
  draws integer not null default 0,
  points numeric(8, 2) not null default 0,
  rank integer,
  status public.standing_status not null default 'active',
  updated_at timestamptz not null default now(),
  unique (event_id, entry_id)
);

alter table public.fight_results enable row level security;
alter table public.standings enable row level security;

create policy "Staff can manage results"
  on public.fight_results for all to authenticated
  using (public.is_admin() or public.has_permission('results.manage'))
  with check (public.is_admin() or public.has_permission('results.manage'));

create policy "Staff can read standings"
  on public.standings for select to authenticated
  using (public.is_admin() or public.has_permission('standings.view') or public.has_permission('results.manage'));

create policy "Staff can manage standings"
  on public.standings for all to authenticated
  using (public.is_admin() or public.has_permission('results.manage'))
  with check (public.is_admin() or public.has_permission('results.manage'));

create policy "Public can read published standings"
  on public.standings for select to anon
  using (
    exists (
      select 1 from public.events e
      where e.id = event_id and e.is_public and e.publish_standings and e.deleted_at is null
    )
  );

grant select, insert, update, delete on public.fight_results to authenticated;
grant select, insert, update, delete on public.standings to authenticated;
