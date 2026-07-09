create type public.event_format as enum ('classic', 'derby');

alter table public.events
  add column event_format public.event_format not null default 'derby';

alter table public.events
  alter column derby_type drop not null;

alter table public.events
  add constraint events_format_check check (
    (event_format = 'classic' and cocks_per_entry = 1 and derby_type is null)
    or (event_format = 'derby' and derby_type is not null)
  );
