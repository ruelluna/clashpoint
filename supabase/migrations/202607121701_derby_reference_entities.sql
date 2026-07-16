-- Derby eligibility: competitors, roosters registry, bands, associations

create table public.competitors (
  id uuid primary key default gen_random_uuid(),
  display_name text not null,
  contact_number text,
  email text,
  address text,
  competitor_level public.competitor_level not null default 'unrated',
  suggested_competitor_level public.competitor_level,
  competitor_level_assigned_by uuid references auth.users (id) on delete set null,
  competitor_level_assigned_at timestamptz,
  competitor_level_notes text,
  notes text,
  created_by uuid references auth.users (id) on delete set null,
  updated_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.gamefarms (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact_number text,
  address text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.breeders (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact_number text,
  address text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.associations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.competitor_associations (
  competitor_id uuid not null references public.competitors (id) on delete cascade,
  association_id uuid not null references public.associations (id) on delete cascade,
  member_number text,
  verified_at timestamptz,
  verified_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (competitor_id, association_id)
);

create sequence if not exists public.rooster_code_seq start 1;

create table public.roosters (
  id uuid primary key default gen_random_uuid(),
  rooster_code text not null unique,
  name text,
  competitor_id uuid references public.competitors (id) on delete set null,
  gamefarm_id uuid references public.gamefarms (id) on delete set null,
  breeder_id uuid references public.breeders (id) on delete set null,
  age_class public.age_class not null default 'unknown',
  hatch_date date,
  hatch_date_is_estimated boolean not null default false,
  annual_molt_status text,
  competition_class public.competition_class not null default 'unclassified',
  suggested_competition_class public.competition_class,
  competition_class_assigned_by uuid references auth.users (id) on delete set null,
  competition_class_assigned_at timestamptz,
  competition_class_notes text,
  breed text,
  bloodline text,
  sex text default 'male',
  declared_external_experience_status public.experience_status,
  calculated_experience_status public.experience_status not null default 'unknown',
  external_experience_notes text,
  external_experience_proof text,
  external_experience_verified_by uuid references auth.users (id) on delete set null,
  external_experience_verified_at timestamptz,
  origin_type public.origin_type not null default 'unknown',
  country_of_origin text,
  province_of_origin text,
  municipality_of_origin text,
  breeder_name_external text,
  breeding_relationship public.breeding_relationship not null default 'unknown',
  origin_verified boolean not null default false,
  origin_proof_attachment text,
  origin_notes text,
  created_by uuid references auth.users (id) on delete set null,
  updated_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.rooster_bands (
  id uuid primary key default gen_random_uuid(),
  rooster_id uuid not null references public.roosters (id) on delete cascade,
  band_level public.band_level not null default 'unbanded',
  band_organization text,
  band_number text not null,
  band_year integer,
  band_season text,
  band_location public.band_location,
  band_color text,
  verification_status public.band_verification_status not null default 'unverified',
  verification_notes text,
  proof_attachment text,
  verified_by uuid references auth.users (id) on delete set null,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.rooster_classification_history (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id uuid not null,
  classification_field text not null,
  previous_value text,
  new_value text not null,
  notes text,
  assigned_by uuid references auth.users (id) on delete set null,
  event_id uuid references public.events (id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.entries
  add column if not exists competitor_id uuid references public.competitors (id) on delete set null,
  add column if not exists entry_division public.entry_division not null default 'unassigned',
  add column if not exists entry_division_assigned_by uuid references auth.users (id) on delete set null,
  add column if not exists entry_division_assigned_at timestamptz,
  add column if not exists entry_division_notes text;

create index competitors_display_name_idx on public.competitors (display_name);
create index roosters_rooster_code_idx on public.roosters (rooster_code);
create index roosters_competitor_id_idx on public.roosters (competitor_id);
create index rooster_bands_rooster_id_idx on public.rooster_bands (rooster_id);
create index rooster_bands_lookup_idx on public.rooster_bands (band_organization, band_number, band_year);

create trigger competitors_set_updated_at
  before update on public.competitors
  for each row execute function public.set_profiles_updated_at();

create trigger gamefarms_set_updated_at
  before update on public.gamefarms
  for each row execute function public.set_profiles_updated_at();

create trigger breeders_set_updated_at
  before update on public.breeders
  for each row execute function public.set_profiles_updated_at();

create trigger roosters_set_updated_at
  before update on public.roosters
  for each row execute function public.set_profiles_updated_at();

create trigger rooster_bands_set_updated_at
  before update on public.rooster_bands
  for each row execute function public.set_profiles_updated_at();

alter table public.competitors enable row level security;
alter table public.gamefarms enable row level security;
alter table public.breeders enable row level security;
alter table public.associations enable row level security;
alter table public.competitor_associations enable row level security;
alter table public.roosters enable row level security;
alter table public.rooster_bands enable row level security;
alter table public.rooster_classification_history enable row level security;

create policy "Staff can manage competitors"
  on public.competitors for all to authenticated
  using (public.is_admin() or public.has_permission('entries.manage') or public.has_permission('rooster.view'))
  with check (public.is_admin() or public.has_permission('entries.manage') or public.has_permission('rooster.create'));

create policy "Staff can manage gamefarms"
  on public.gamefarms for all to authenticated
  using (public.is_admin() or public.has_permission('entries.manage') or public.has_permission('rooster.view'))
  with check (public.is_admin() or public.has_permission('entries.manage') or public.has_permission('rooster.create'));

create policy "Staff can manage breeders"
  on public.breeders for all to authenticated
  using (public.is_admin() or public.has_permission('entries.manage') or public.has_permission('rooster.view'))
  with check (public.is_admin() or public.has_permission('entries.manage') or public.has_permission('rooster.create'));

create policy "Staff can manage associations"
  on public.associations for all to authenticated
  using (public.is_admin() or public.has_permission('derby_eligibility.manage') or public.has_permission('events.manage'))
  with check (public.is_admin() or public.has_permission('derby_eligibility.manage') or public.has_permission('events.manage'));

create policy "Staff can manage competitor associations"
  on public.competitor_associations for all to authenticated
  using (public.is_admin() or public.has_permission('entries.manage') or public.has_permission('derby_eligibility.manage'))
  with check (public.is_admin() or public.has_permission('entries.manage') or public.has_permission('derby_eligibility.manage'));

create policy "Staff can manage roosters"
  on public.roosters for all to authenticated
  using (public.is_admin() or public.has_permission('rooster.view') or public.has_permission('entries.manage'))
  with check (public.is_admin() or public.has_permission('rooster.create') or public.has_permission('rooster.update') or public.has_permission('entries.manage'));

create policy "Staff can manage rooster bands"
  on public.rooster_bands for all to authenticated
  using (public.is_admin() or public.has_permission('banding.view') or public.has_permission('entries.manage'))
  with check (public.is_admin() or public.has_permission('banding.create') or public.has_permission('banding.verify') or public.has_permission('entries.manage'));

create policy "Staff can read classification history"
  on public.rooster_classification_history for select to authenticated
  using (public.is_admin() or public.has_permission('classification.view') or public.has_permission('entries.manage'));

create policy "Staff can insert classification history"
  on public.rooster_classification_history for insert to authenticated
  with check (public.is_admin() or public.has_permission('classification.assign_rooster_class') or public.has_permission('classification.assign_competitor_level') or public.has_permission('classification.assign_entry_division'));

grant select, insert, update, delete on public.competitors to authenticated;
grant select, insert, update, delete on public.gamefarms to authenticated;
grant select, insert, update, delete on public.breeders to authenticated;
grant select, insert, update, delete on public.associations to authenticated;
grant select, insert, update, delete on public.competitor_associations to authenticated;
grant select, insert, update, delete on public.roosters to authenticated;
grant select, insert, update, delete on public.rooster_bands to authenticated;
grant select, insert on public.rooster_classification_history to authenticated;
grant usage, select on sequence public.rooster_code_seq to authenticated;
