create type public.lineup_status as enum ('draft', 'submitted', 'verified', 'rejected');
create type public.weight_status as enum ('pending', 'passed', 'failed', 'for_review');

create table public.rooster_records (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references public.entries (id) on delete cascade,
  event_id uuid not null references public.events (id) on delete cascade,
  cock_number integer not null,
  band_number text not null,
  declared_weight numeric(6, 2),
  category text,
  color_marking text,
  status public.lineup_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_id, band_number),
  unique (entry_id, cock_number)
);

create table public.weighings (
  id uuid primary key default gen_random_uuid(),
  rooster_record_id uuid not null unique references public.rooster_records (id) on delete cascade,
  entry_id uuid not null references public.entries (id) on delete cascade,
  event_id uuid not null references public.events (id) on delete cascade,
  official_weight numeric(6, 2),
  weight_status public.weight_status not null default 'pending',
  verified_by uuid references auth.users (id) on delete set null,
  verified_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.rooster_records enable row level security;
alter table public.weighings enable row level security;

create policy "Staff can manage lineups"
  on public.rooster_records for all to authenticated
  using (public.is_admin() or public.has_permission('lineups.manage') or public.has_permission('weighing.manage'))
  with check (public.is_admin() or public.has_permission('lineups.manage') or public.has_permission('weighing.manage'));

create policy "Staff can manage weighings"
  on public.weighings for all to authenticated
  using (public.is_admin() or public.has_permission('weighing.manage'))
  with check (public.is_admin() or public.has_permission('weighing.manage'));

grant select, insert, update, delete on public.rooster_records to authenticated;
grant select, insert, update, delete on public.weighings to authenticated;
