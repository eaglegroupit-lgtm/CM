-- Chart of accounts: Tally-style groups and ledgers
create table account_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  parent_group_id uuid references account_groups (id),
  nature account_nature not null,
  normal_balance balance_side not null, -- which side increases this group's balance
  is_system boolean not null default false, -- seeded Tally-standard groups cannot be deleted
  created_at timestamptz not null default now()
);

create table ledgers (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  group_id uuid not null references account_groups (id),
  opening_balance numeric(14, 2) not null default 0,
  opening_balance_type balance_side not null default 'debit',
  gstin text,
  address text,
  state text,
  phone text,
  email text,
  party_type party_type not null default 'none',
  credit_limit numeric(14, 2),
  credit_days integer,
  bank_account_no text,
  bank_ifsc text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index ledgers_group_id_idx on ledgers (group_id);

-- Convenience view: resolves each ledger's ultimate group nature (asset/liability/income/expense/equity)
create view ledger_with_nature as
select l.*, g.name as group_name, g.nature, g.normal_balance
from ledgers l
join account_groups g on g.id = l.group_id;
