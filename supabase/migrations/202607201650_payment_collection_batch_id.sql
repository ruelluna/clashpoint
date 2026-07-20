-- Group payment rows created in a single cashier collect for itemized batch receipts.

alter table public.payments
  add column if not exists collection_batch_id uuid;

create index if not exists payments_collection_batch_id_idx
  on public.payments (collection_batch_id)
  where collection_batch_id is not null;

comment on column public.payments.collection_batch_id is
  'Shared UUID linking payment rows from one cashier collect (registration dues batch receipt).';
