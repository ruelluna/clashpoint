ALTER TABLE payments
  ADD COLUMN amount_tendered numeric(12, 2),
  ADD COLUMN change_given numeric(12, 2);

ALTER TABLE payments
  ADD CONSTRAINT payments_tender_change_check
  CHECK (
    (amount_tendered IS NULL AND change_given IS NULL)
    OR (
      amount_tendered IS NOT NULL
      AND change_given IS NOT NULL
      AND change_given >= 0
      AND change_given = amount_tendered - amount_paid
    )
  );

COMMENT ON COLUMN payments.amount_tendered IS 'Cash given by the customer at the terminal';
COMMENT ON COLUMN payments.change_given IS 'Change returned to the customer (amount_tendered - amount_paid)';
