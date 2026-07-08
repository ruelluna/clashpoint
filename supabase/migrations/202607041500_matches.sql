create type public.match_status as enum ('draft', 'for_review', 'confirmed', 'locked', 'ready', 'ongoing', 'completed', 'cancelled');
create type public.fight_side as enum ('meron', 'wala');

create table public.matches (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  fight_number integer not null,
  round_number integer default 1,
  meron_entry_id uuid not null references public.entries (id),
  meron_rooster_id uuid not null references public.rooster_records (id),
  meron_weight numeric(6, 2),
  wala_entry_id uuid not null references public.entries (id),
  wala_rooster_id uuid not null references public.rooster_records (id),
  wala_weight numeric(6, 2),
  status public.match_status not null default 'draft',
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_id, fight_number)
);

alter table public.matches enable row level security;

create policy "Staff can manage matches"
  on public.matches for all to authenticated
  using (public.is_admin() or public.has_permission('matches.manage') or public.has_permission('events.view'))
  with check (public.is_admin() or public.has_permission('matches.manage'));

create policy "Public can read published matches"
  on public.matches for select to anon
  using (
    exists (
      select 1 from public.events e
      where e.id = event_id and e.is_public and e.publish_matches and e.deleted_at is null
    )
  );

grant select, insert, update, delete on public.matches to authenticated;
