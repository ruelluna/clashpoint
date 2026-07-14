-- Move handler from owner entry to rooster registration; add owner contact fields

alter table public.competitors
  add column if not exists contact_full_name text,
  add column if not exists contact_designation text;

alter table public.entries
  add column if not exists contact_full_name text,
  add column if not exists contact_designation text;

alter table public.rooster_event_registrations
  add column if not exists handler_name text;

update public.rooster_event_registrations r
set handler_name = e.handler_name
from public.entries e
where r.entry_id = e.id
  and e.handler_name is not null
  and r.handler_name is null;

alter table public.entries
  drop column if exists handler_name;
