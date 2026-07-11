-- Simplify app_role to 5 values; add per-user module permissions for staff role.

create table public.user_permissions (
  user_id uuid not null references public.profiles (id) on delete cascade,
  permission_id text not null references public.permissions (id) on delete cascade,
  primary key (user_id, permission_id)
);

create index user_permissions_user_id_idx on public.user_permissions (user_id);

-- Copy job-title role grants to per-user rows before enum swap
insert into public.user_permissions (user_id, permission_id)
select p.id, rp.permission_id
from public.profiles p
join public.role_permissions rp on rp.role = p.role
where p.role in (
  'registration_staff',
  'finance_staff',
  'weighing_staff',
  'matchmaker',
  'result_recorder'
)
on conflict do nothing;

alter type public.app_role rename to app_role_old;

create type public.app_role as enum (
  'admin',
  'system_owner',
  'event_organizer',
  'promoter',
  'staff'
);

alter table public.profiles
  alter column role drop default;

-- RLS policies on profiles reference role; drop before enum column swap
drop policy if exists "Users can read own profile or admins read all" on public.profiles;
drop policy if exists "Users can update own display name" on public.profiles;
drop policy if exists "Admins can update profiles" on public.profiles;
drop policy if exists "Admins can read all profiles" on public.profiles;

alter table public.profiles
  alter column role type public.app_role
  using (
    case role::text
      when 'admin' then 'admin'
      when 'system_owner' then 'system_owner'
      when 'event_organizer' then 'event_organizer'
      when 'promoter' then 'promoter'
      else 'staff'
    end
  )::public.app_role;

create policy "Users can read own profile or admins read all"
  on public.profiles
  for select
  to authenticated
  using (id = auth.uid() or public.is_admin());

create policy "Users can update own display name"
  on public.profiles
  for update
  to authenticated
  using (id = auth.uid())
  with check (
    id = auth.uid()
    and role = (select p.role from public.profiles p where p.id = auth.uid())
  );

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

delete from public.role_permissions
where role::text not in ('event_organizer', 'promoter');

alter table public.role_permissions
  alter column role type public.app_role
  using (role::text::public.app_role);

drop function if exists public.get_user_role();

create function public.get_user_role()
returns public.app_role
language sql
stable
security definer
set search_path = public
as $$
  select role
  from public.profiles
  where id = auth.uid();
$$;

drop type public.app_role_old;

-- event_organizer preset (operational modules, no users/settings)
insert into public.role_permissions (role, permission_id)
select 'event_organizer', id
from public.permissions
where id in (
  'events.manage',
  'events.view',
  'entries.manage',
  'payments.manage',
  'lineups.manage',
  'weighing.manage',
  'matches.manage',
  'results.manage',
  'standings.view',
  'winners.manage',
  'payouts.manage',
  'settlements.manage',
  'reports.view',
  'audit.view'
)
on conflict do nothing;

insert into public.role_permissions (role, permission_id) values
  ('promoter', 'events.view'),
  ('promoter', 'reports.view')
on conflict do nothing;

create or replace function public.has_permission(permission_key text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_admin()
    or exists (
      select 1
      from public.profiles p
      join public.role_permissions rp on rp.role = p.role
      where p.id = auth.uid()
        and p.is_active = true
        and rp.permission_id = permission_key
    )
    or exists (
      select 1
      from public.profiles p
      join public.user_permissions up on up.user_id = p.id
      where p.id = auth.uid()
        and p.is_active = true
        and p.role = 'staff'
        and up.permission_id = permission_key
    );
$$;

create or replace function public.can_access_dashboard()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.is_active = true
      and (
        p.role in ('admin', 'system_owner', 'event_organizer', 'promoter')
        or (
          p.role = 'staff'
          and exists (
            select 1
            from public.user_permissions up
            where up.user_id = p.id
          )
        )
      )
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  bootstrap_role public.app_role;
  bootstrap_display_name text;
begin
  bootstrap_role := case
    when public.needs_bootstrap() then 'system_owner'::public.app_role
    else 'staff'::public.app_role
  end;

  bootstrap_display_name := nullif(trim(new.raw_user_meta_data->>'display_name'), '');

  insert into public.profiles (id, role, display_name)
  values (new.id, bootstrap_role, bootstrap_display_name);

  return new;
end;
$$;

alter table public.user_permissions enable row level security;

create policy "Users can read own permissions"
  on public.user_permissions
  for select
  to authenticated
  using (user_id = auth.uid() or public.is_admin() or public.has_permission('users.manage'));

create policy "Admins can manage user permissions"
  on public.user_permissions
  for all
  to authenticated
  using (public.is_admin() or public.has_permission('users.manage'))
  with check (public.is_admin() or public.has_permission('users.manage'));

grant select, insert, update, delete on public.user_permissions to authenticated;
