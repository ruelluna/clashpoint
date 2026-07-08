-- First admin bootstrap: assign system_owner in the auth trigger so the service
-- role does not need direct UPDATE grants on profiles during initial setup.

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
    else 'public_viewer'::public.app_role
  end;

  bootstrap_display_name := nullif(trim(new.raw_user_meta_data->>'display_name'), '');

  insert into public.profiles (id, role, display_name)
  values (new.id, bootstrap_role, bootstrap_display_name);

  return new;
end;
$$;
