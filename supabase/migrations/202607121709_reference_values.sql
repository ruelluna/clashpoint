create type public.reference_value_kind as enum ('breed', 'bloodline', 'color_marking');

create table public.reference_values (
  id uuid primary key default gen_random_uuid(),
  kind public.reference_value_kind not null,
  name text not null,
  normalized_name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint reference_values_name_not_blank check (char_length(trim(name)) > 0),
  constraint reference_values_normalized_name_not_blank check (char_length(trim(normalized_name)) > 0),
  unique (kind, normalized_name)
);

create index reference_values_kind_name_idx
  on public.reference_values (kind, name);

create trigger reference_values_set_updated_at
  before update on public.reference_values
  for each row execute function public.set_profiles_updated_at();

alter table public.reference_values enable row level security;

create policy "Staff can manage reference values"
  on public.reference_values for all to authenticated
  using (
    public.is_admin()
    or public.has_permission('entries.manage')
    or public.has_permission('rooster.view')
  )
  with check (
    public.is_admin()
    or public.has_permission('entries.manage')
    or public.has_permission('rooster.create')
    or public.has_permission('rooster.update')
  );

grant select, insert, update, delete on public.reference_values to authenticated;

insert into public.reference_values (kind, name, normalized_name)
select distinct 'breed'::public.reference_value_kind, trim(breed), lower(trim(breed))
from public.roosters
where breed is not null and char_length(trim(breed)) > 0
on conflict (kind, normalized_name) do nothing;

insert into public.reference_values (kind, name, normalized_name)
select distinct 'bloodline'::public.reference_value_kind, trim(bloodline), lower(trim(bloodline))
from public.roosters
where bloodline is not null and char_length(trim(bloodline)) > 0
on conflict (kind, normalized_name) do nothing;

insert into public.reference_values (kind, name, normalized_name)
select distinct 'color_marking'::public.reference_value_kind, trim(color_marking), lower(trim(color_marking))
from public.rooster_event_registrations
where color_marking is not null and char_length(trim(color_marking)) > 0
on conflict (kind, normalized_name) do nothing;
