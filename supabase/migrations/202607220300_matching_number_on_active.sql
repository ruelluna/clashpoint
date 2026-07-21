-- Matching numbers are assigned when a fight enters Active Match (handlers called),
-- not at match creation.

ALTER TABLE public.matches
  ALTER COLUMN matching_number DROP NOT NULL;

UPDATE public.matches
SET matching_number = NULL
WHERE queue_status IS NULL OR queue_status = 'waiting';
