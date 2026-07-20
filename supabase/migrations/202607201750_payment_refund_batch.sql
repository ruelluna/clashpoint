-- Group refund rows from one cashier refund action and preserve refunded amount for receipts.

alter table public.payments
  add column if not exists refund_batch_id uuid;

alter table public.payments
  add column if not exists refunded_amount numeric(12, 2);

create index if not exists payments_refund_batch_id_idx
  on public.payments (refund_batch_id)
  where refund_batch_id is not null;

comment on column public.payments.refund_batch_id is
  'Shared UUID linking payment rows refunded in one cashier action.';

comment on column public.payments.refunded_amount is
  'Amount returned to the customer when payment_status became refunded.';
