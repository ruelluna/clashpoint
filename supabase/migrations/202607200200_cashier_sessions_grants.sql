-- cashier_sessions had RLS policies but no table grants for authenticated role (42501)

grant usage on type public.cashier_session_status to authenticated;
grant usage on type public.cashier_session_movement_type to authenticated;

grant select, insert, update, delete on public.cashier_sessions to authenticated;
grant select, insert, update, delete on public.cashier_session_movements to authenticated;

-- Staff with payments access need profile display names (ledger, receipts, handover picker)
create policy "Finance can read profile names"
  on public.profiles for select to authenticated
  using (
    public.has_permission('payments.manage')
    or public.has_permission('events.view')
    or public.has_permission('events.manage')
  );
