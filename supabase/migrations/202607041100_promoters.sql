create type public.promoter_status as enum ('active', 'inactive', 'suspended');
create type public.commission_type as enum ('none', 'fixed', 'percentage', 'custom');

create table public.promoters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users (id) on delete set null,
  name text not null,
  contact_person text,
  phone text,
  email text,
  address text,
  status public.promoter_status not null default 'active',
  commission_type public.commission_type not null default 'none',
  commission_value numeric(12, 2),
  notes text,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index promoters_status_idx on public.promoters (status);
create index promoters_user_id_idx on public.promoters (user_id) where user_id is not null;

create trigger promoters_set_updated_at
  before update on public.promoters
  for each row execute function public.set_profiles_updated_at();

alter table public.promoters enable row level security;

create policy "Staff can read promoters"
  on public.promoters for select to authenticated
  using (public.is_admin() or public.has_permission('promoters.manage') or public.has_permission('events.view'));

create policy "Admins can manage promoters"
  on public.promoters for all to authenticated
  using (public.is_admin() or public.has_permission('promoters.manage'))
  with check (public.is_admin() or public.has_permission('promoters.manage'));

create policy "Linked promoter reads own profile"
  on public.promoters for select to authenticated
  using (user_id = auth.uid());

grant select, insert, update, delete on public.promoters to authenticated;
