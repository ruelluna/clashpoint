-- Service role needs profile/user_permissions access for E2E test user seeding.

grant select, insert, update, delete on public.profiles to service_role;
grant select, insert, update, delete on public.user_permissions to service_role;
