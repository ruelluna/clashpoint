-- Public registration: email OTP verification when claiming an existing game farm

create table public.registration_owner_verifications (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  competitor_id uuid not null references public.competitors (id) on delete cascade,
  email text not null,
  code_hash text not null,
  expires_at timestamptz not null,
  verified_at timestamptz,
  attempt_count integer not null default 0,
  created_at timestamptz not null default now()
);

create index registration_owner_verifications_event_competitor_idx
  on public.registration_owner_verifications (event_id, competitor_id, created_at desc);

alter table public.registration_owner_verifications enable row level security;

-- Service role / admin client only; no authenticated policies
