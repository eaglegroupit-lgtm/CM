-- Voucher line items: the double-entry ledger lines, inventory lines, and GST tax lines
create table voucher_ledger_entries (
  id uuid primary key default gen_random_uuid(),
  voucher_id uuid not null references vouchers (id) on delete cascade,
  ledger_id uuid not null references ledgers (id),
  debit_amount numeric(14, 2) not null default 0 check (debit_amount >= 0),
  credit_amount numeric(14, 2) not null default 0 check (credit_amount >= 0),
  narration text,
  sort_order integer not null default 0,
  constraint one_side_only check (
    (debit_amount = 0 and credit_amount > 0) or (debit_amount > 0 and credit_amount = 0)
  )
);

create index vle_voucher_idx on voucher_ledger_entries (voucher_id);
create index vle_ledger_idx on voucher_ledger_entries (ledger_id);

create table voucher_inventory_entries (
  id uuid primary key default gen_random_uuid(),
  voucher_id uuid not null references vouchers (id) on delete cascade,
  stock_item_id uuid not null references stock_items (id),
  lot_id uuid references stock_lots (id),
  godown_id uuid not null references godowns (id),
  quantity numeric(14, 2) not null check (quantity > 0),
  rate numeric(14, 2) not null,
  amount numeric(14, 2) not null,
  sort_order integer not null default 0
);

create index vie_voucher_idx on voucher_inventory_entries (voucher_id);

create table voucher_tax_details (
  id uuid primary key default gen_random_uuid(),
  voucher_id uuid not null references vouchers (id) on delete cascade,
  tax_type tax_type not null,
  taxable_value numeric(14, 2) not null default 0,
  rate numeric(5, 2) not null default 0,
  amount numeric(14, 2) not null default 0
);

create index vtd_voucher_idx on voucher_tax_details (voucher_id);

-- Ensure every voucher's ledger lines balance (sum debit = sum credit) once posted
create function check_voucher_balanced(p_voucher_id uuid)
returns boolean
language sql
stable
as $$
  select coalesce(sum(debit_amount), 0) = coalesce(sum(credit_amount), 0)
  from voucher_ledger_entries
  where voucher_id = p_voucher_id;
$$;

create function enforce_voucher_balance_on_post()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'posted' and old.status is distinct from 'posted' then
    if not check_voucher_balanced(new.id) then
      raise exception 'Voucher % is not balanced (debit <> credit)', new.voucher_no;
    end if;
  end if;
  return new;
end;
$$;

create trigger vouchers_enforce_balance
  before update on vouchers
  for each row execute function enforce_voucher_balance_on_post();
