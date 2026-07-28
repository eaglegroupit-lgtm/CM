-- Bill-wise tracking for accurate outstanding/ageing (Tally's "New Ref" / "Against Ref")
create table bills (
  id uuid primary key default gen_random_uuid(),
  voucher_id uuid not null references vouchers (id) on delete cascade,
  ledger_id uuid not null references ledgers (id),
  bill_no text not null, -- usually the voucher_no of the originating sales/purchase voucher
  bill_date date not null,
  due_date date,
  amount numeric(14, 2) not null,
  is_closed boolean not null default false,
  created_at timestamptz not null default now()
);

create index bills_ledger_idx on bills (ledger_id);
create index bills_voucher_idx on bills (voucher_id);

create table bill_allocations (
  id uuid primary key default gen_random_uuid(),
  voucher_id uuid not null references vouchers (id) on delete cascade, -- the payment/receipt voucher
  bill_id uuid not null references bills (id),
  amount numeric(14, 2) not null check (amount > 0)
);

create index bill_allocations_bill_idx on bill_allocations (bill_id);
create index bill_allocations_voucher_idx on bill_allocations (voucher_id);

-- Outstanding balance per bill = bill amount - sum of allocations against it
create view bill_outstanding as
select
  b.id as bill_id,
  b.ledger_id,
  b.bill_no,
  b.bill_date,
  b.due_date,
  b.amount,
  coalesce(sum(ba.amount), 0) as allocated_amount,
  b.amount - coalesce(sum(ba.amount), 0) as outstanding_amount,
  b.is_closed
from bills b
left join bill_allocations ba on ba.bill_id = b.id
group by b.id;
