-- Orthogonal staff ops focus: at most one non-deleted active event.
alter table public.events
  add column if not exists is_active boolean not null default false;

create unique index if not exists events_one_active_idx
  on public.events ((true))
  where is_active and deleted_at is null;

comment on column public.events.is_active is
  'Staff ops focus flag; independent of lifecycle status. At most one non-deleted event may be active.';
