-- Inventory: categories, units, godowns, items (slab/tile/quartz/simple), lots, stock ledger
create table stock_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique
);

create table units_of_measure (
  id uuid primary key default gen_random_uuid(),
  name text not null unique, -- Nos, Sq.ft, Box, Slab, Sheet
  symbol text not null
);

create table godowns (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  address text,
  is_default boolean not null default false
);

create table stock_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category_id uuid not null references stock_categories (id),
  item_type stock_item_type not null default 'simple',
  unit_id uuid not null references units_of_measure (id),
  hsn_code text,
  gst_rate numeric(5, 2) not null default 0,
  standard_rate numeric(14, 2) not null default 0,
  low_stock_qty numeric(14, 2) not null default 0,
  tracks_lots boolean not null default false,
  -- type-specific attributes (nullable, populated based on item_type)
  thickness_mm numeric(6, 2),
  finish text, -- polished / leather / flamed / honed
  color text,
  size text, -- e.g. 600x600 for tiles
  brand text, -- e.g. for quartz
  opening_qty numeric(14, 2) not null default 0,
  opening_value numeric(14, 2) not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index stock_items_category_idx on stock_items (category_id);

-- Batch/lot tracking for slabs, quartz sheets and (optionally) tiles
create table stock_lots (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references stock_items (id),
  lot_no text not null,
  bundle_no text,
  thickness_mm numeric(6, 2),
  godown_id uuid not null references godowns (id),
  purchase_voucher_id uuid references vouchers (id),
  total_qty numeric(14, 2) not null default 0,
  rate numeric(14, 2) not null default 0,
  status lot_status not null default 'in_stock',
  created_at timestamptz not null default now(),
  unique (item_id, lot_no)
);

create index stock_lots_item_idx on stock_lots (item_id);

-- Single source of truth for every stock movement; balances are derived, never stored mutably
create table stock_ledger_entries (
  id uuid primary key default gen_random_uuid(),
  voucher_id uuid not null references vouchers (id) on delete cascade,
  item_id uuid not null references stock_items (id),
  lot_id uuid references stock_lots (id),
  godown_id uuid not null references godowns (id),
  move_type stock_move_type not null,
  quantity numeric(14, 2) not null check (quantity > 0),
  rate numeric(14, 2) not null,
  amount numeric(14, 2) not null,
  entry_date date not null,
  created_at timestamptz not null default now()
);

create index stock_ledger_voucher_idx on stock_ledger_entries (voucher_id);
create index stock_ledger_item_idx on stock_ledger_entries (item_id, entry_date);

-- Current on-hand quantity/value per item, derived from stock_ledger_entries + opening balance
create view stock_balances as
select
  si.id as item_id,
  si.name,
  si.category_id,
  si.unit_id,
  si.item_type,
  si.low_stock_qty,
  si.opening_qty + coalesce(sum(case when sle.move_type = 'in' then sle.quantity else -sle.quantity end), 0) as balance_qty,
  si.opening_value + coalesce(sum(case when sle.move_type = 'in' then sle.amount else -sle.amount end), 0) as balance_value
from stock_items si
left join stock_ledger_entries sle on sle.item_id = si.id
group by si.id;

-- Current on-hand quantity per lot. total_qty is the original received quantity (display only);
-- the balance itself comes entirely from stock_ledger_entries, since the receiving purchase
-- voucher always writes its own "in" entry for the lot (no separate opening to add on top).
create view lot_balances as
select
  sl.id as lot_id,
  sl.item_id,
  sl.lot_no,
  sl.bundle_no,
  sl.godown_id,
  sl.rate,
  sl.status,
  sl.total_qty,
  coalesce(sum(case when sle.move_type = 'in' then sle.quantity else -sle.quantity end), 0) as remaining_qty
from stock_lots sl
left join stock_ledger_entries sle on sle.lot_id = sl.id
group by sl.id;
