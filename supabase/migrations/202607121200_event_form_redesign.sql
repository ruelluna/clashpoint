-- Event form redesign: consolidate event_type to classic/derby, update derby_type, add new fields

-- 1. Add new columns before enum swaps
alter table public.events
  add column if not exists tax_per_fight numeric(12, 2) not null default 0,
  add column if not exists registration_rules text;

-- 2. Migrate event_type from event_format (if event_format exists)
alter table public.events
  add column if not exists event_classification text;

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'events'
      and column_name = 'event_format'
  ) then
    update public.events
    set event_classification = event_format::text;
  else
    update public.events
    set event_classification = 'derby'
    where event_classification is null;
  end if;
end $$;

update public.events
set event_classification = 'derby'
where event_classification is null
   or event_classification not in ('classic', 'derby');

-- Drop event_format constraint and column if present
alter table public.events drop constraint if exists events_format_check;

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'events'
      and column_name = 'event_format'
  ) then
    alter table public.events drop column event_format;
  end if;
end $$;

drop type if exists public.event_format;

-- 3. Replace event_type enum (house/sponsored/etc -> classic/derby)
alter table public.events drop column if exists event_type;

drop type if exists public.event_type;

create type public.event_type as enum ('classic', 'derby');

alter table public.events
  add column event_type public.event_type not null default 'derby';

update public.events
set event_type = event_classification::public.event_type;

alter table public.events drop column event_classification;

-- 4. Replace derby_type enum (add 2_cock, remove stag/bullstag)
create type public.derby_type_new as enum ('2_cock', '3_cock', '4_cock', '5_cock', 'custom');

alter table public.events
  add column derby_type_new public.derby_type_new;

update public.events
set derby_type_new = case derby_type::text
  when '3_cock' then '3_cock'::public.derby_type_new
  when '4_cock' then '4_cock'::public.derby_type_new
  when '5_cock' then '5_cock'::public.derby_type_new
  when 'stag' then '5_cock'::public.derby_type_new
  when 'bullstag' then '5_cock'::public.derby_type_new
  when 'custom' then 'custom'::public.derby_type_new
  else null
end
where derby_type is not null;

alter table public.events drop column derby_type;

alter table public.events rename column derby_type_new to derby_type;

drop type if exists public.derby_type;

alter type public.derby_type_new rename to derby_type;

-- 5. Format check constraint
alter table public.events
  add constraint events_type_check check (
    (event_type = 'classic' and cocks_per_entry = 1 and derby_type is null)
    or (event_type = 'derby' and derby_type is not null)
  );

-- 6. Default venue in system settings
insert into public.system_settings (key, value)
values ('default_venue', '"Main Arena"'::jsonb)
on conflict (key) do nothing;
