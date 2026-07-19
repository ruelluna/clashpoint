-- Link existing event entries to the global owners (competitors) registry.
-- Creates one competitor per distinct owner name and links the earliest entry per event.

insert into public.competitors (
  display_name,
  contact_full_name,
  contact_designation,
  contact_number,
  email,
  created_by,
  updated_by
)
select
  distinct_owners.display_name,
  distinct_owners.contact_full_name,
  distinct_owners.contact_designation,
  distinct_owners.contact_number,
  distinct_owners.email,
  distinct_owners.created_by,
  distinct_owners.created_by
from (
  select distinct on (lower(trim(e.owner_name)))
    trim(e.owner_name) as display_name,
    e.contact_full_name,
    e.contact_designation,
    e.contact_number,
    e.email,
    e.created_by
  from public.entries e
  where e.competitor_id is null
    and e.deleted_at is null
    and trim(e.owner_name) <> ''
  order by lower(trim(e.owner_name)), e.created_at asc
) as distinct_owners
where not exists (
  select 1
  from public.competitors c
  where c.deleted_at is null
    and lower(trim(c.display_name)) = lower(trim(distinct_owners.display_name))
);

update public.entries e
set competitor_id = matched.competitor_id
from (
  select distinct on (e2.event_id, lower(trim(e2.owner_name)))
    e2.id as entry_id,
    c.id as competitor_id
  from public.entries e2
  inner join public.competitors c
    on c.deleted_at is null
    and lower(trim(c.display_name)) = lower(trim(e2.owner_name))
  where e2.competitor_id is null
    and e2.deleted_at is null
    and trim(e2.owner_name) <> ''
  order by e2.event_id, lower(trim(e2.owner_name)), e2.created_at asc
) as matched
where e.id = matched.entry_id;
