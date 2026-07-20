-- Rename fight queue enum values to action-oriented pit terminology
alter type public.fight_queue_status rename value 'scheduled' to 'waiting';
alter type public.fight_queue_status rename value 'called' to 'handlers_called';
alter type public.fight_queue_status rename value 'ready' to 'birds_at_pit';
alter type public.fight_queue_status rename value 'ongoing' to 'fighting';

-- Rename match lifecycle enum values (fight-day mirrors)
alter type public.match_status rename value 'locked' to 'queued';
alter type public.match_status rename value 'ready' to 'at_pit';
alter type public.match_status rename value 'ongoing' to 'fighting';
