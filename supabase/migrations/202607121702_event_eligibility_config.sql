-- Derby eligibility: event configuration, policies, pairing rules

-- Rename derby_type (format) to derby_format
alter table public.events rename column derby_type to derby_format;

alter table public.events drop constraint if exists events_type_check;

alter table public.events
  add constraint events_type_check check (
    (event_type = 'classic' and cocks_per_entry = 1 and derby_format is null)
    or (event_type = 'derby' and derby_format is not null)
  );

-- Add derby age type and eligibility configuration columns
alter table public.events
  add column derby_type public.derby_age_type default 'open_derby',
  add column allowed_age_classes text[] default array['stag', 'bullstag', 'cock']::text[],
  add column min_weight_grams integer,
  add column max_weight_grams integer,
  add column match_weight_tolerance_grams integer,
  add column weight_verification_required boolean not null default false,
  add column require_rooster_entry_approval boolean not null default false,
  add column require_separate_entry_approver boolean not null default false,
  add column allow_conditional_approval boolean not null default true,
  add column conditionally_approved_match_handling public.conditionally_approved_match_handling not null default 'exclude',
  add column eligibility_enforcement_enabled boolean not null default false,
  add column classification_matching_enabled boolean not null default false,
  add column unknown_value_handling public.unknown_value_handling not null default 'approval_required',
  add column approval_config jsonb not null default '{}'::jsonb;

-- Migrate existing kg weights to grams
update public.events
set
  min_weight_grams = case when min_weight is not null then round(min_weight * 1000)::integer else null end,
  max_weight_grams = case when max_weight is not null then round(max_weight * 1000)::integer else null end
where min_weight is not null or max_weight is not null;

create table public.derby_eligibility_policies (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  policy_status public.policy_status not null default 'draft',
  allowed_age_classes text[] not null default array['stag', 'bullstag', 'cock']::text[],
  minimum_weight_grams integer,
  maximum_weight_grams integer,
  weight_verification_required boolean not null default false,
  banding_required boolean not null default false,
  allow_unbanded boolean not null default true,
  accepted_band_levels public.band_level[] default array[]::public.band_level[],
  accepted_band_organizations text[] default array[]::text[],
  accepted_band_years integer[] default array[]::integer[],
  accepted_band_seasons text[] default array[]::text[],
  band_verification_required boolean not null default false,
  allowed_experience_statuses public.experience_status[] default array[]::public.experience_status[],
  allowed_origin_types public.origin_type[] default array[]::public.origin_type[],
  allowed_breeding_relationships public.breeding_relationship[] default array[]::public.breeding_relationship[],
  association_members_only boolean not null default false,
  approved_association_ids uuid[] default array[]::uuid[],
  locally_bred_only boolean not null default false,
  imported_allowed boolean not null default true,
  origin_verification_required boolean not null default false,
  physical_inspection_required boolean not null default false,
  document_verification_required boolean not null default false,
  entry_fee_payment_required boolean not null default false,
  unknown_value_handling public.unknown_value_handling not null default 'approval_required',
  eligibility_notes text,
  created_by uuid references auth.users (id) on delete set null,
  updated_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_id)
);

create table public.event_pairing_rules (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  classification_type public.classification_type not null,
  first_value text not null,
  second_value text not null,
  pairing_status public.pairing_status not null default 'allowed',
  notes text,
  created_by uuid references auth.users (id) on delete set null,
  updated_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_id, classification_type, first_value, second_value)
);

create table public.physical_inspections (
  id uuid primary key default gen_random_uuid(),
  registration_id uuid,
  event_id uuid not null references public.events (id) on delete cascade,
  inspection_status public.inspection_status not null default 'pending',
  notes text,
  inspected_by uuid references auth.users (id) on delete set null,
  inspected_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger derby_eligibility_policies_set_updated_at
  before update on public.derby_eligibility_policies
  for each row execute function public.set_profiles_updated_at();

create trigger event_pairing_rules_set_updated_at
  before update on public.event_pairing_rules
  for each row execute function public.set_profiles_updated_at();

create trigger physical_inspections_set_updated_at
  before update on public.physical_inspections
  for each row execute function public.set_profiles_updated_at();

alter table public.derby_eligibility_policies enable row level security;
alter table public.event_pairing_rules enable row level security;
alter table public.physical_inspections enable row level security;

create policy "Staff can manage eligibility policies"
  on public.derby_eligibility_policies for all to authenticated
  using (public.is_admin() or public.has_permission('derby_eligibility.manage') or public.has_permission('events.manage'))
  with check (public.is_admin() or public.has_permission('derby_eligibility.manage') or public.has_permission('events.manage'));

create policy "Staff can read eligibility policies"
  on public.derby_eligibility_policies for select to authenticated
  using (public.is_admin() or public.has_permission('derby_eligibility.view') or public.has_permission('events.view'));

create policy "Staff can manage pairing rules"
  on public.event_pairing_rules for all to authenticated
  using (public.is_admin() or public.has_permission('classification.manage_pairing_rules') or public.has_permission('events.manage'))
  with check (public.is_admin() or public.has_permission('classification.manage_pairing_rules') or public.has_permission('events.manage'));

create policy "Staff can read pairing rules"
  on public.event_pairing_rules for select to authenticated
  using (public.is_admin() or public.has_permission('classification.view') or public.has_permission('events.view'));

create policy "Staff can manage inspections"
  on public.physical_inspections for all to authenticated
  using (public.is_admin() or public.has_permission('inspection.record') or public.has_permission('entries.manage'))
  with check (public.is_admin() or public.has_permission('inspection.record') or public.has_permission('entries.manage'));

grant select, insert, update, delete on public.derby_eligibility_policies to authenticated;
grant select, insert, update, delete on public.event_pairing_rules to authenticated;
grant select, insert, update, delete on public.physical_inspections to authenticated;
