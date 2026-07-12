-- Derby eligibility: overrides and band duplicate warnings

create table public.entry_eligibility_overrides (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  registration_id uuid not null references public.rooster_event_registrations (id) on delete cascade,
  rule_being_overridden text not null,
  original_eligibility_result jsonb not null,
  original_approval_result text,
  override_reason text not null,
  supporting_notes text,
  status public.override_status not null default 'pending',
  requested_by uuid not null references auth.users (id) on delete restrict,
  requested_at timestamptz not null default now(),
  approved_by uuid references auth.users (id) on delete set null,
  approved_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.matchup_overrides (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  first_registration_id uuid not null references public.rooster_event_registrations (id) on delete cascade,
  second_registration_id uuid not null references public.rooster_event_registrations (id) on delete cascade,
  original_compatibility_result jsonb not null,
  rule_being_overridden text not null,
  override_reason text not null,
  status public.override_status not null default 'pending',
  requested_by uuid not null references auth.users (id) on delete restrict,
  requested_at timestamptz not null default now(),
  approved_by uuid references auth.users (id) on delete set null,
  approved_at timestamptz,
  fight_id uuid references public.matches (id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.band_duplicate_warnings (
  id uuid primary key default gen_random_uuid(),
  band_id uuid not null references public.rooster_bands (id) on delete cascade,
  duplicate_band_id uuid references public.rooster_bands (id) on delete set null,
  band_organization text,
  band_number text not null,
  band_year integer,
  band_season text,
  warning_message text not null,
  investigated boolean not null default false,
  investigated_by uuid references auth.users (id) on delete set null,
  investigated_at timestamptz,
  investigation_notes text,
  created_at timestamptz not null default now()
);

alter table public.entry_eligibility_overrides enable row level security;
alter table public.matchup_overrides enable row level security;
alter table public.band_duplicate_warnings enable row level security;

create policy "Staff can manage entry eligibility overrides"
  on public.entry_eligibility_overrides for all to authenticated
  using (public.is_admin() or public.has_permission('derby_eligibility.override') or public.has_permission('events.manage'))
  with check (public.is_admin() or public.has_permission('derby_eligibility.override') or public.has_permission('events.manage'));

create policy "Staff can manage matchup overrides"
  on public.matchup_overrides for all to authenticated
  using (public.is_admin() or public.has_permission('classification.approve_exception') or public.has_permission('matches.manage'))
  with check (public.is_admin() or public.has_permission('classification.approve_exception') or public.has_permission('matches.manage'));

create policy "Staff can manage band duplicate warnings"
  on public.band_duplicate_warnings for all to authenticated
  using (public.is_admin() or public.has_permission('banding.view') or public.has_permission('entries.manage'))
  with check (public.is_admin() or public.has_permission('banding.view') or public.has_permission('entries.manage'));

grant select, insert, update, delete on public.entry_eligibility_overrides to authenticated;
grant select, insert, update, delete on public.matchup_overrides to authenticated;
grant select, insert, update, delete on public.band_duplicate_warnings to authenticated;
