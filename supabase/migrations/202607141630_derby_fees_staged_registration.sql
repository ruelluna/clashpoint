-- Derby staged registration: fees, barcodes, stage permissions, payment categories

insert into public.permissions (id, description) values
  ('owner_registration.manage', 'Register derby owners / game farms (stage 1)'),
  ('owner_registration.print', 'Print OWNER barcode slips'),
  ('cock_entry.manage', 'Add rooster entries at weighing station (stage 2)'),
  ('cock_entry.print', 'Print COCK ENTRY barcode slips'),
  ('payments.print', 'Print payment receipts')
on conflict (id) do nothing;

insert into public.role_permissions (role, permission_id)
select 'event_organizer'::public.app_role, p.id
from public.permissions p
where p.id in (
  'owner_registration.manage',
  'owner_registration.print',
  'cock_entry.manage',
  'cock_entry.print',
  'payments.print'
)
on conflict do nothing;

insert into public.user_permissions (user_id, permission_id)
select up.user_id, p.id
from public.user_permissions up
cross join public.permissions p
where up.permission_id = 'entries.manage'
  and p.id in (
    'owner_registration.manage',
    'owner_registration.print',
    'cock_entry.manage',
    'cock_entry.print'
  )
on conflict do nothing;

insert into public.user_permissions (user_id, permission_id)
select up.user_id, p.id
from public.user_permissions up
cross join public.permissions p
where up.permission_id = 'payments.manage'
  and p.id = 'payments.print'
on conflict do nothing;

alter table public.events
  add column if not exists registration_fee_enabled boolean not null default false,
  add column if not exists registration_fee_amount numeric(12, 2) not null default 0,
  add column if not exists rooster_entry_fee_enabled boolean not null default false,
  add column if not exists rooster_entry_fee_amount numeric(12, 2) not null default 0,
  add column if not exists cash_bond_enabled boolean not null default false,
  add column if not exists cash_bond_amount numeric(12, 2) not null default 0;

update public.events
set
  registration_fee_enabled = entry_fee > 0,
  registration_fee_amount = entry_fee
where entry_fee > 0;

alter table public.entries
  add column if not exists owner_barcode text,
  add column if not exists fee_snapshot jsonb;

create unique index if not exists entries_event_owner_barcode_unique
  on public.entries (event_id, owner_barcode)
  where owner_barcode is not null and deleted_at is null;

alter table public.rooster_event_registrations
  add column if not exists cock_entry_barcode text;

create unique index if not exists rooster_regs_event_cock_barcode_unique
  on public.rooster_event_registrations (event_id, cock_entry_barcode)
  where cock_entry_barcode is not null;

create type public.payment_category as enum (
  'registration',
  'rooster_entry',
  'cash_bond',
  'adjustment',
  'legacy'
);

alter table public.payments
  add column if not exists payment_category public.payment_category not null default 'legacy';

create table if not exists public.event_fee_adjustments (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  changed_by uuid references auth.users (id) on delete set null,
  previous_settings jsonb not null,
  new_settings jsonb not null,
  entries_with_payments_count integer not null default 0,
  total_refund_due numeric(12, 2) not null default 0,
  total_collect_due numeric(12, 2) not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.entry_fee_adjustment_lines (
  id uuid primary key default gen_random_uuid(),
  adjustment_id uuid not null references public.event_fee_adjustments (id) on delete cascade,
  entry_id uuid not null references public.entries (id) on delete cascade,
  previous_amount_due numeric(12, 2) not null,
  new_amount_due numeric(12, 2) not null,
  amount_paid numeric(12, 2) not null default 0,
  delta numeric(12, 2) not null,
  created_at timestamptz not null default now()
);

create index event_fee_adjustments_event_id_idx on public.event_fee_adjustments (event_id);
create index entry_fee_adjustment_lines_adjustment_id_idx on public.entry_fee_adjustment_lines (adjustment_id);

alter table public.event_fee_adjustments enable row level security;
alter table public.entry_fee_adjustment_lines enable row level security;

create policy "Staff can read fee adjustments"
  on public.event_fee_adjustments for select to authenticated
  using (
    public.is_admin()
    or public.has_permission('events.view')
    or public.has_permission('payments.manage')
  );

create policy "Organizers can manage fee adjustments"
  on public.event_fee_adjustments for insert to authenticated
  with check (public.is_admin() or public.has_permission('events.manage'));

create policy "Staff can read adjustment lines"
  on public.entry_fee_adjustment_lines for select to authenticated
  using (
    public.is_admin()
    or public.has_permission('events.view')
    or public.has_permission('payments.manage')
  );

create policy "Organizers can insert adjustment lines"
  on public.entry_fee_adjustment_lines for insert to authenticated
  with check (public.is_admin() or public.has_permission('events.manage'));

grant select, insert on public.event_fee_adjustments to authenticated;
grant select, insert on public.entry_fee_adjustment_lines to authenticated;

drop policy if exists "Staff can read entries" on public.entries;
drop policy if exists "Staff can manage entries" on public.entries;

create policy "Staff can read entries"
  on public.entries for select to authenticated
  using (
    public.is_admin()
    or public.has_permission('entries.manage')
    or public.has_permission('owner_registration.manage')
    or public.has_permission('cock_entry.manage')
    or public.has_permission('payments.manage')
    or public.has_permission('events.view')
  );

create policy "Staff can manage entries"
  on public.entries for all to authenticated
  using (
    public.is_admin()
    or public.has_permission('entries.manage')
    or public.has_permission('owner_registration.manage')
  )
  with check (
    public.is_admin()
    or public.has_permission('entries.manage')
    or public.has_permission('owner_registration.manage')
  );
