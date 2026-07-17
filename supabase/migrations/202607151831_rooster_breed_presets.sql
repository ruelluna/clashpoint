insert into public.reference_values (kind, name, normalized_name)
values
  ('breed'::public.reference_value_kind, 'Talisayon', 'talisayon'),
  ('breed'::public.reference_value_kind, 'Buyugon', 'buyugon')
on conflict (kind, normalized_name) do nothing;
