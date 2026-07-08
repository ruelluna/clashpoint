create table public.permissions (
  id text primary key,
  description text not null,
  created_at timestamptz not null default now()
);

create table public.role_permissions (
  role public.app_role not null,
  permission_id text not null references public.permissions (id) on delete cascade,
  primary key (role, permission_id)
);

create table public.system_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null
);

alter table public.profiles
  add column if not exists is_active boolean not null default true,
  add column if not exists deactivated_at timestamptz;

-- Default new users to least privilege
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, role)
  values (new.id, 'public_viewer');
  return new;
end;
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select role in ('admin', 'system_owner') from public.profiles where id = auth.uid()),
    false
  );
$$;

create or replace function public.is_system_owner()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_admin();
$$;

create or replace function public.has_permission(permission_key text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    join public.role_permissions rp on rp.role = p.role
    where p.id = auth.uid()
      and p.is_active = true
      and rp.permission_id = permission_key
  )
  or public.is_admin();
$$;

create or replace function public.can_access_dashboard()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.is_active = true
      and p.role not in ('public_viewer')
  );
$$;

-- Seed permissions
insert into public.permissions (id, description) values
  ('users.manage', 'Manage users and roles'),
  ('users.invite', 'Invite new users'),
  ('settings.manage', 'Manage system settings'),
  ('audit.view', 'View audit trail'),
  ('promoters.manage', 'Manage promoters'),
  ('events.manage', 'Manage events'),
  ('events.view', 'View events'),
  ('entries.manage', 'Manage registrations'),
  ('payments.manage', 'Manage payments'),
  ('lineups.manage', 'Manage lineups'),
  ('weighing.manage', 'Manage weighing'),
  ('matches.manage', 'Manage matching'),
  ('results.manage', 'Manage fight results'),
  ('standings.view', 'View standings'),
  ('winners.manage', 'Finalize winners'),
  ('payouts.manage', 'Manage payouts'),
  ('settlements.manage', 'Manage promoter settlements'),
  ('reports.view', 'View reports')
on conflict (id) do nothing;

-- system_owner gets all permissions via is_admin(); map staff roles
insert into public.role_permissions (role, permission_id)
select 'event_organizer', id from public.permissions
where id in ('events.manage', 'events.view', 'entries.manage', 'payments.manage', 'lineups.manage', 'weighing.manage', 'matches.manage', 'results.manage', 'standings.view', 'winners.manage', 'payouts.manage', 'settlements.manage', 'reports.view', 'audit.view')
on conflict do nothing;

insert into public.role_permissions (role, permission_id) values
  ('registration_staff', 'entries.manage'),
  ('registration_staff', 'events.view'),
  ('finance_staff', 'payments.manage'),
  ('finance_staff', 'payouts.manage'),
  ('finance_staff', 'settlements.manage'),
  ('finance_staff', 'events.view'),
  ('finance_staff', 'reports.view'),
  ('weighing_staff', 'weighing.manage'),
  ('weighing_staff', 'lineups.manage'),
  ('weighing_staff', 'events.view'),
  ('matchmaker', 'matches.manage'),
  ('matchmaker', 'events.view'),
  ('result_recorder', 'results.manage'),
  ('result_recorder', 'standings.view'),
  ('result_recorder', 'events.view'),
  ('promoter', 'events.view'),
  ('promoter', 'reports.view')
on conflict do nothing;

-- Default settings
insert into public.system_settings (key, value) values
  ('org_name', '"ClashPoint"'::jsonb),
  ('legal_disclaimer', '"This platform is for licensed and legally authorized derby operators only."'::jsonb),
  ('terms_accepted', 'false'::jsonb)
on conflict (key) do nothing;

-- Audit log admin read
create policy "Admins can read audit logs"
  on public.audit_logs
  for select
  to authenticated
  using (public.is_admin() or public.has_permission('audit.view'));

-- Permissions RLS
alter table public.permissions enable row level security;
alter table public.role_permissions enable row level security;
alter table public.system_settings enable row level security;

create policy "Authenticated can read permissions"
  on public.permissions for select to authenticated using (true);

create policy "Authenticated can read role permissions"
  on public.role_permissions for select to authenticated using (true);

create policy "Admins can read system settings"
  on public.system_settings for select to authenticated
  using (public.is_admin() or public.has_permission('settings.manage'));

create policy "Admins can update system settings"
  on public.system_settings for update to authenticated
  using (public.is_admin() or public.has_permission('settings.manage'))
  with check (public.is_admin() or public.has_permission('settings.manage'));

-- Admins can update any profile role
create policy "Admins can update profiles"
  on public.profiles
  for update
  to authenticated
  using (public.is_admin() or public.has_permission('users.manage'))
  with check (public.is_admin() or public.has_permission('users.manage'));

create policy "Admins can read all profiles"
  on public.profiles
  for select
  to authenticated
  using (id = auth.uid() or public.is_admin() or public.has_permission('users.manage'));

grant select on public.permissions to authenticated;
grant select on public.role_permissions to authenticated;
grant select, update on public.system_settings to authenticated;
