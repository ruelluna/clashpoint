create or replace function public.needs_bootstrap()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select not exists (
    select 1
    from public.profiles
    where role in ('admin', 'system_owner')
  );
$$;

grant execute on function public.needs_bootstrap() to anon, authenticated, service_role;
