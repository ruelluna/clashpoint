create type public.registration_status as enum ('submitted', 'pending_review', 'approved', 'rejected', 'cancelled', 'confirmed');
create type public.payment_status as enum ('unpaid', 'partial', 'paid', 'refunded');
create type public.entry_source as enum ('walk_in', 'online', 'promoter_invite', 'staff_encoded');

create table public.entries (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  referred_by_promoter_id uuid references public.promoters (id) on delete set null,
  entry_number text not null,
  entry_name text not null,
  owner_name text not null,
  handler_name text,
  contact_number text,
  email text,
  address text,
  entry_source public.entry_source default 'staff_encoded',
  registration_status public.registration_status not null default 'submitted',
  payment_status public.payment_status not null default 'unpaid',
  notes text,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (event_id, entry_number)
);

create type public.payment_method as enum ('cash', 'bank_transfer', 'gcash', 'other');

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  payment_reference text not null unique,
  entry_id uuid not null references public.entries (id) on delete cascade,
  event_id uuid not null references public.events (id) on delete cascade,
  amount_due numeric(12, 2) not null,
  amount_paid numeric(12, 2) not null default 0,
  balance numeric(12, 2) not null default 0,
  payment_method public.payment_method,
  receipt_number text,
  payment_status public.payment_status not null default 'unpaid',
  receipt_path text,
  received_by uuid references auth.users (id) on delete set null,
  paid_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index entries_event_id_idx on public.entries (event_id);
create index payments_entry_id_idx on public.payments (entry_id);
create index payments_event_id_idx on public.payments (event_id);

alter table public.entries enable row level security;
alter table public.payments enable row level security;

create policy "Staff can read entries"
  on public.entries for select to authenticated
  using (public.is_admin() or public.has_permission('entries.manage') or public.has_permission('events.view'));

create policy "Staff can manage entries"
  on public.entries for all to authenticated
  using (public.is_admin() or public.has_permission('entries.manage'))
  with check (public.is_admin() or public.has_permission('entries.manage'));

create policy "Finance can read payments"
  on public.payments for select to authenticated
  using (public.is_admin() or public.has_permission('payments.manage') or public.has_permission('events.view'));

create policy "Finance can manage payments"
  on public.payments for all to authenticated
  using (public.is_admin() or public.has_permission('payments.manage'))
  with check (public.is_admin() or public.has_permission('payments.manage'));

grant select, insert, update, delete on public.entries to authenticated;
grant select, insert, update, delete on public.payments to authenticated;
