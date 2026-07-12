-- audit_logs had RLS policies but no table grants for authenticated role
grant select, insert on public.audit_logs to authenticated;
