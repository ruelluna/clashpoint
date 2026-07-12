-- Server-side createAdminClient() uses service_role. It bypasses RLS but still
-- requires table-level grants. Without these, public registration and other
-- admin-client flows fail with 42501 permission denied.

grant usage on schema public to service_role;

grant select, insert, update, delete on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to service_role;

alter default privileges in schema public
  grant select, insert, update, delete on tables to service_role;

alter default privileges in schema public
  grant usage, select on sequences to service_role;
