-- Cashier Terminal: allow payments.manage to settle pledges and entry fees
-- without granting matches.manage, entries.manage, or lineups.manage.

-- match_bets: split ALL policy so cashiers can UPDATE payment fields (app layer only)
drop policy if exists "Staff can manage match bets" on public.match_bets;

create policy "Match staff can insert match bets"
  on public.match_bets for insert to authenticated
  with check (public.is_admin() or public.has_permission('matches.manage'));

create policy "Match staff can delete match bets"
  on public.match_bets for delete to authenticated
  using (public.is_admin() or public.has_permission('matches.manage'));

create policy "Staff can update match bets"
  on public.match_bets for update to authenticated
  using (
    public.is_admin()
    or public.has_permission('matches.manage')
    or public.has_permission('payments.manage')
  )
  with check (
    public.is_admin()
    or public.has_permission('matches.manage')
    or public.has_permission('payments.manage')
  );

-- entries: cashier can sync payment_status after collection
create policy "Cashier can update entry payment status"
  on public.entries for update to authenticated
  using (public.is_admin() or public.has_permission('payments.manage'))
  with check (public.is_admin() or public.has_permission('payments.manage'));

-- rooster_event_registrations: cashier read for COCK scan + reg_payment_status sync
create policy "Cashier can read rooster registrations"
  on public.rooster_event_registrations for select to authenticated
  using (
    public.is_admin()
    or public.has_permission('payments.manage')
    or public.has_permission('lineups.manage')
    or public.has_permission('weighing.manage')
  );

create policy "Cashier can update registration payment status"
  on public.rooster_event_registrations for update to authenticated
  using (public.is_admin() or public.has_permission('payments.manage'))
  with check (public.is_admin() or public.has_permission('payments.manage'));

-- matches: cashier can auto-promote to queue after payment settlement
create policy "Cashier can promote matches to queue"
  on public.matches for update to authenticated
  using (
    public.is_admin()
    or public.has_permission('matches.manage')
    or public.has_permission('payments.manage')
  )
  with check (
    public.is_admin()
    or public.has_permission('matches.manage')
    or (
      public.has_permission('payments.manage')
      and status = 'queued'::public.match_status
      and queue_status = 'waiting'::public.fight_queue_status
    )
  );
