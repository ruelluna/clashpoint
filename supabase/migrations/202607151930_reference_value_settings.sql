insert into public.reference_values (kind, name, normalized_name)
values
  ('color_marking'::public.reference_value_kind, 'Black', 'black'),
  ('color_marking'::public.reference_value_kind, 'Red', 'red')
on conflict (kind, normalized_name) do nothing;

insert into public.system_settings (key, value)
values
  ('allow_public_breed_add', 'true'::jsonb),
  ('allow_public_color_add', 'true'::jsonb)
on conflict (key) do nothing;

drop policy if exists "Staff can manage reference values" on public.reference_values;

create policy "Staff can manage reference values"
  on public.reference_values for all to authenticated
  using (
    public.is_admin()
    or public.has_permission('entries.manage')
    or public.has_permission('rooster.view')
    or public.has_permission('settings.manage')
  )
  with check (
    public.is_admin()
    or public.has_permission('entries.manage')
    or public.has_permission('rooster.create')
    or public.has_permission('rooster.update')
    or public.has_permission('settings.manage')
  );
