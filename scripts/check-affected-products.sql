-- Diagnostic: Find products where has_serial_number = false but SNs exist
-- This identifies products affected by the has_serial_number flag sync bug

SELECT
  p.id,
  p.brand,
  p.model,
  p.stock,
  p.has_serial_number,
  p.created_at,
  COUNT(sn.sn) AS sn_count,
  STRING_AGG(sn.sn, ', ') AS serial_numbers
FROM products p
INNER JOIN serial_numbers sn ON sn.product_id = p.id
WHERE p.has_serial_number = false
  AND p.deleted = false
GROUP BY p.id, p.brand, p.model, p.stock, p.has_serial_number, p.created_at
ORDER BY p.created_at DESC;

-- Summary count
SELECT
  COUNT(*) AS affected_product_count
FROM products p
WHERE p.has_serial_number = false
  AND p.deleted = false
  AND EXISTS (SELECT 1 FROM serial_numbers sn WHERE sn.product_id = p.id);
