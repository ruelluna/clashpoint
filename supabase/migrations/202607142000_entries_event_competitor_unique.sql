-- One saved owner (competitor) may register only once per event.
-- Soft-delete duplicate active rows before enforcing the partial unique index.

with ranked_entries as (
  select
    id,
    row_number() over (
      partition by event_id, competitor_id
      order by created_at asc, entry_number asc, id asc
    ) as row_rank
  from public.entries
  where competitor_id is not null
    and deleted_at is null
)
update public.entries e
set
  deleted_at = now(),
  updated_at = now()
from ranked_entries r
where e.id = r.id
  and r.row_rank > 1;

create unique index if not exists entries_event_competitor_unique
  on public.entries (event_id, competitor_id)
  where competitor_id is not null and deleted_at is null;
