create type public.event_type as enum ('house', 'external_promoter', 'sponsored', 'test');
create type public.event_status as enum (
  'draft', 'open', 'registration_closed', 'ready_for_weighing',
  'ready_for_matching', 'ongoing', 'completed', 'cancelled', 'archived'
);
create type public.derby_type as enum ('3_cock', '4_cock', '5_cock', 'stag', 'bullstag', 'custom');
create type public.scoring_system as enum ('win_loss', 'points');
create type public.prize_type as enum ('percentage', 'fixed', 'manual');

create table public.events (
  id uuid primary key default gen_random_uuid(),
  promoter_id uuid references public.promoters (id) on delete set null,
  name text not null,
  venue text not null,
  event_date timestamptz not null,
  registration_deadline timestamptz,
  event_type public.event_type not null default 'house',
  derby_type public.derby_type not null default '5_cock',
  entry_fee numeric(12, 2) not null default 0,
  min_entries integer,
  max_entries integer,
  cocks_per_entry integer not null default 5,
  min_weight numeric(6, 2),
  max_weight numeric(6, 2),
  scoring_system public.scoring_system not null default 'points',
  draw_rule text not null default '0.5 points',
  tie_breaker_rule text not null default 'shared_championship',
  status public.event_status not null default 'draft',
  guaranteed_prize_amount numeric(12, 2),
  house_deduction numeric(12, 2) default 0,
  venue_share numeric(12, 2) default 0,
  legal_authorized boolean not null default false,
  is_public boolean not null default false,
  publish_matches boolean not null default false,
  publish_standings boolean not null default false,
  publish_winners boolean not null default false,
  publish_prize_amounts boolean not null default false,
  notes text,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.prize_structures (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null unique references public.events (id) on delete cascade,
  prize_type public.prize_type not null default 'percentage',
  config jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index events_status_idx on public.events (status);
create index events_promoter_id_idx on public.events (promoter_id);
create index events_event_date_idx on public.events (event_date);

create trigger events_set_updated_at
  before update on public.events
  for each row execute function public.set_profiles_updated_at();

alter table public.events enable row level security;
alter table public.prize_structures enable row level security;

create policy "Staff can read events"
  on public.events for select to authenticated
  using (public.is_admin() or public.has_permission('events.view') or public.has_permission('events.manage'));

create policy "Staff can manage events"
  on public.events for all to authenticated
  using (public.is_admin() or public.has_permission('events.manage'))
  with check (public.is_admin() or public.has_permission('events.manage'));

create policy "Public can read published events"
  on public.events for select to anon
  using (is_public = true and deleted_at is null);

create policy "Staff can read prize structures"
  on public.prize_structures for select to authenticated
  using (public.is_admin() or public.has_permission('events.view') or public.has_permission('events.manage'));

create policy "Staff can manage prize structures"
  on public.prize_structures for all to authenticated
  using (public.is_admin() or public.has_permission('events.manage'))
  with check (public.is_admin() or public.has_permission('events.manage'));

grant select, insert, update, delete on public.events to authenticated;
grant select, insert, update, delete on public.prize_structures to authenticated;
