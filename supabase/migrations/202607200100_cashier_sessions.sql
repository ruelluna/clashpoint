-- Cashier sessions: per-staff terminal shifts with opening float and handovers

create type public.cashier_session_status as enum ('open', 'closed');

create type public.cashier_session_movement_type as enum (
  'opening_float',
  'admin_handover',
  'adjustment'
);

alter table public.events
  add column if not exists cashier_opening_float_default numeric(12, 2) not null default 0;

create table public.cashier_sessions (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  staff_user_id uuid not null references public.profiles (id) on delete restrict,
  opening_float_amount numeric(12, 2) not null,
  opening_float_default numeric(12, 2) not null default 0,
  opening_float_note text,
  status public.cashier_session_status not null default 'open',
  opened_at timestamptz not null default now(),
  closed_at timestamptz,
  closing_counted_cash numeric(12, 2),
  closing_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index cashier_sessions_event_id_opened_at_idx
  on public.cashier_sessions (event_id, opened_at desc);

create unique index cashier_sessions_one_open_per_staff_event_uidx
  on public.cashier_sessions (event_id, staff_user_id)
  where status = 'open';

create table public.cashier_session_movements (
  id uuid primary key default gen_random_uuid(),
  cashier_session_id uuid not null references public.cashier_sessions (id) on delete cascade,
  event_id uuid not null references public.events (id) on delete cascade,
  movement_type public.cashier_session_movement_type not null,
  amount numeric(12, 2) not null,
  description text not null,
  admin_user_id uuid references public.profiles (id) on delete set null,
  recorded_by uuid not null references public.profiles (id) on delete restrict,
  created_at timestamptz not null default now()
);

create index cashier_session_movements_session_id_created_at_idx
  on public.cashier_session_movements (cashier_session_id, created_at);

create index cashier_session_movements_event_id_created_at_idx
  on public.cashier_session_movements (event_id, created_at desc);

alter table public.payments
  add column if not exists cashier_session_id uuid references public.cashier_sessions (id) on delete set null;

create index payments_cashier_session_id_idx
  on public.payments (cashier_session_id)
  where cashier_session_id is not null;

alter table public.event_revolving_fund_ledger
  add column if not exists cashier_session_id uuid references public.cashier_sessions (id) on delete set null;

alter table public.cashier_sessions enable row level security;
alter table public.cashier_session_movements enable row level security;

create policy "Staff can read cashier sessions"
  on public.cashier_sessions for select to authenticated
  using (
    public.is_admin()
    or public.has_permission('payments.manage')
    or public.has_permission('events.view')
    or public.has_permission('events.manage')
  );

create policy "Operational staff can manage cashier sessions"
  on public.cashier_sessions for all to authenticated
  using (
    not public.is_admin()
    and public.has_permission('payments.manage')
  )
  with check (
    not public.is_admin()
    and public.has_permission('payments.manage')
  );

create policy "Staff can read cashier session movements"
  on public.cashier_session_movements for select to authenticated
  using (
    public.is_admin()
    or public.has_permission('payments.manage')
    or public.has_permission('events.view')
    or public.has_permission('events.manage')
  );

create policy "Operational staff can manage cashier session movements"
  on public.cashier_session_movements for all to authenticated
  using (
    not public.is_admin()
    and public.has_permission('payments.manage')
  )
  with check (
    not public.is_admin()
    and public.has_permission('payments.manage')
  );

grant usage on type public.cashier_session_status to authenticated;
grant usage on type public.cashier_session_movement_type to authenticated;

grant select, insert, update, delete on public.cashier_sessions to authenticated;
grant select, insert, update, delete on public.cashier_session_movements to authenticated;

-- Backfill default cashier opening float from revolving fund initial where unset
update public.events
set cashier_opening_float_default = revolving_fund_initial
where cashier_opening_float_default = 0
  and revolving_fund_initial > 0;
