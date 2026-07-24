-- Active match sequence: matching numbers use event-wide +1 suffix at birds_at_pit,
-- not fight_number. Clear premature assignments from the handlers_called trigger.

UPDATE public.matches
SET matching_number = NULL
WHERE queue_status IN ('waiting', 'handlers_called');
