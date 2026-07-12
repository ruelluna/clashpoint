-- Evolve rooster_records into rooster_event_registrations with registry linkage

alter table public.rooster_records
  add column registry_rooster_id uuid references public.roosters (id) on delete set null,
  add column entry_rooster_role public.entry_rooster_role not null default 'primary',
  add column registration_status public.registration_workflow_status not null default 'draft',
  add column approval_status public.rooster_approval_status not null default 'not_submitted',
  add column eligibility_status public.eligibility_status not null default 'pending_review',
  add column inspection_status public.inspection_status not null default 'not_required',
  add column reg_payment_status public.registration_payment_status not null default 'not_required',
  add column eligibility_snapshot jsonb,
  add column eligibility_checked_at timestamptz,
  add column eligibility_checked_by uuid references auth.users (id) on delete set null,
  add column submitted_by uuid references auth.users (id) on delete set null,
  add column submitted_at timestamptz,
  add column reviewed_by uuid references auth.users (id) on delete set null,
  add column reviewed_at timestamptz,
  add column approved_by uuid references auth.users (id) on delete set null,
  add column approved_at timestamptz,
  add column approval_notes text,
  add column rejected_by uuid references auth.users (id) on delete set null,
  add column rejected_at timestamptz,
  add column rejection_category public.rejection_category,
  add column rejection_reason text,
  add column eligibility_override_reason text,
  add column eligibility_override_approved_by uuid references auth.users (id) on delete set null,
  add column eligibility_override_approved_at timestamptz,
  add column withdrawn_by uuid references auth.users (id) on delete set null,
  add column withdrawn_at timestamptz,
  add column withdrawal_reason text,
  add column disqualified_by uuid references auth.users (id) on delete set null,
  add column disqualified_at timestamptz,
  add column disqualification_reason text,
  add column conditional_approval_condition text,
  add column conditional_approval_deadline timestamptz,
  add column declared_weight_grams integer,
  add column official_weight_grams integer,
  add column weighed_at timestamptz,
  add column weighed_by uuid references auth.users (id) on delete set null,
  add column weight_verified boolean not null default false,
  add column weight_verification_status public.weight_status,
  add column weight_notes text;

-- Backfill registry roosters from existing rooster_records
insert into public.roosters (
  rooster_code,
  age_class,
  created_at,
  updated_at
)
select
  'CP-R-' || lpad(nextval('public.rooster_code_seq')::text, 5, '0'),
  case lower(trim(coalesce(rr.category, '')))
    when 'stag' then 'stag'::public.age_class
    when 'bullstag' then 'bullstag'::public.age_class
    when 'bull stag' then 'bullstag'::public.age_class
    when 'cock' then 'cock'::public.age_class
    else 'unknown'::public.age_class
  end,
  rr.created_at,
  rr.updated_at
from public.rooster_records rr
order by rr.created_at;

-- Link registry roosters (ordered pairing)
with numbered_records as (
  select
    rr.id as record_id,
    row_number() over (order by rr.created_at) as rn
  from public.rooster_records rr
),
numbered_roosters as (
  select
    r.id as rooster_id,
    row_number() over (order by r.created_at) as rn
  from public.roosters r
)
update public.rooster_records rr
set registry_rooster_id = nr.rooster_id
from numbered_records rec
join numbered_roosters nr on rec.rn = nr.rn
where rr.id = rec.record_id;

-- Create rooster_bands from existing band_number
insert into public.rooster_bands (
  rooster_id,
  band_level,
  band_number,
  verification_status,
  created_at,
  updated_at
)
select
  rr.registry_rooster_id,
  case when rr.band_number is not null and trim(rr.band_number) <> '' then 'other'::public.band_level else 'unbanded'::public.band_level end,
  coalesce(nullif(trim(rr.band_number), ''), 'UNBANDED'),
  case when rr.status = 'verified' then 'verified'::public.band_verification_status else 'unverified'::public.band_verification_status end,
  rr.created_at,
  rr.updated_at
from public.rooster_records rr
where rr.registry_rooster_id is not null
  and not exists (
    select 1 from public.rooster_bands rb where rb.rooster_id = rr.registry_rooster_id
  );

-- Backfill registration workflow from lineup_status
update public.rooster_records rr
set
  declared_weight_grams = case when rr.declared_weight is not null then round(rr.declared_weight * 1000)::integer else null end,
  registration_status = case
    when rr.status = 'verified' then 'approved'::public.registration_workflow_status
    when rr.status = 'submitted' then 'submitted'::public.registration_workflow_status
    when rr.status = 'rejected' then 'rejected'::public.registration_workflow_status
    else 'draft'::public.registration_workflow_status
  end,
  approval_status = case
    when rr.status = 'verified' then 'approved'::public.rooster_approval_status
    when rr.status = 'submitted' then 'pending'::public.rooster_approval_status
    when rr.status = 'rejected' then 'rejected'::public.rooster_approval_status
    else 'not_submitted'::public.rooster_approval_status
  end,
  eligibility_status = case
    when rr.status = 'verified' then 'eligible'::public.eligibility_status
    when rr.status = 'rejected' then 'ineligible'::public.eligibility_status
    else 'pending_review'::public.eligibility_status
  end;

-- Sync official weight from weighings
update public.rooster_records rr
set
  official_weight_grams = round(w.official_weight * 1000)::integer,
  weight_verified = w.verified_at is not null,
  weight_verification_status = w.weight_status,
  weighed_at = w.verified_at,
  weighed_by = w.verified_by
from public.weighings w
where w.rooster_record_id = rr.id
  and w.official_weight is not null;

-- Weighing history support
alter table public.weighings
  add column is_voided boolean not null default false,
  add column voided_by uuid references auth.users (id) on delete set null,
  add column voided_at timestamptz,
  add column void_reason text,
  add column official_weight_grams integer,
  add column weighing_station text;

update public.weighings
set official_weight_grams = round(official_weight * 1000)::integer
where official_weight is not null;

-- Link physical inspections to registrations (after column exists)
alter table public.physical_inspections
  add constraint physical_inspections_registration_id_fkey
  foreign key (registration_id) references public.rooster_records (id) on delete cascade;

-- Rename table to rooster_event_registrations
alter table public.rooster_records rename to rooster_event_registrations;

-- Update physical_inspections FK name is fine via registration_id

create index rooster_event_registrations_registry_idx
  on public.rooster_event_registrations (registry_rooster_id);
create index rooster_event_registrations_event_status_idx
  on public.rooster_event_registrations (event_id, registration_status);
create index rooster_event_registrations_approval_idx
  on public.rooster_event_registrations (event_id, approval_status);

-- Unique: one rooster per event (registry level)
create unique index rooster_event_registrations_event_rooster_unique
  on public.rooster_event_registrations (event_id, registry_rooster_id)
  where registry_rooster_id is not null and registration_status not in ('rejected', 'withdrawn');
