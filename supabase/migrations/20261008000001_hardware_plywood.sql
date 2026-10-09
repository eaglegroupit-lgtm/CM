-- Adapt the platform for a hardware & plywood shop: items carry a separate purchase price so
-- Purchase entries can pre-fill it (standard_rate stays the selling price).
alter table stock_items add column purchase_rate numeric(14, 2) not null default 0;

create or replace view stock_summary as
select
  sb.item_id,
  sb.name,
  sc.name as category_name,
  uom.name as unit_name,
  sb.item_type,
  sb.balance_qty,
  sb.balance_value,
  sb.low_stock_qty,
  (sb.balance_qty <= sb.low_stock_qty) as is_low_stock,
  si.brand,
  si.size,
  si.thickness_mm,
  si.standard_rate,
  si.purchase_rate,
  si.gst_rate
from stock_balances sb
join stock_items si on si.id = sb.item_id
join stock_categories sc on sc.id = si.category_id
join units_of_measure uom on uom.id = si.unit_id;
