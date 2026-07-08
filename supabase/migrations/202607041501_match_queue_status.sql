create type public.fight_queue_status as enum ('scheduled', 'called', 'ready', 'ongoing');

alter table public.matches
  add column queue_status public.fight_queue_status;

create index matches_event_id_fight_number_idx on public.matches (event_id, fight_number);
create index matches_event_id_status_idx on public.matches (event_id, status);
create index matches_event_id_queue_status_idx on public.matches (event_id, queue_status);
