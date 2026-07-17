-- Data repair: fix products where has_serial_number = false but SNs exist
-- This bug occurred when the runtime migration flipped the flag to false on cold start
-- (because SNs were temporarily absent), and then new SNs were added without
-- restoring the flag. The code fix (0012) prevents future occurrences;
-- this migration repairs the existing data.

UPDATE products
SET has_serial_number = true,
    updated_at = NOW()
WHERE has_serial_number = false
  AND EXISTS (
    SELECT 1 FROM serial_numbers
    WHERE serial_numbers.product_id = products.id
  );
