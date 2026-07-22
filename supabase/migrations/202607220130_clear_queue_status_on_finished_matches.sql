-- Finished fights kept queue_status = 'fighting' after result recording, which
-- incorrectly blocked Birds at pit on later queue rows.

UPDATE public.matches
SET queue_status = NULL
WHERE status IN ('settling', 'completed', 'cancelled')
  AND queue_status IS NOT NULL;
