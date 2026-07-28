-- Voucher types and voucher headers (line items depend on inventory tables, added later)
create table voucher_types (
  id uuid primary key default gen_random_uuid(),
  code text not null unique, -- SALE, PURC, PMT, RCPT, JRNL, CONT, DNOTE, CNOTE, SORD, STJR
  name text not null,
  numbering_prefix text not null,
  affects_inventory boolean not null default false,
  affects_tax boolean not null default false,
  requires_party boolean not null default true,
  sort_order integer not null default 0
);

create table vouchers (
  id uuid primary key default gen_random_uuid(),
  voucher_type_id uuid not null references voucher_types (id),
  voucher_no text not null,
  voucher_date date not null default current_date,
  financial_year_id uuid not null references financial_years (id),
  party_ledger_id uuid references ledgers (id),
  reference_no text,
  narration text,
  place_of_supply text, -- state name/code, used to decide CGST+SGST vs IGST
  is_interstate boolean not null default false,
  status voucher_status not null default 'draft',
  total_amount numeric(14, 2) not null default 0,
  created_by uuid references user_profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (voucher_type_id, financial_year_id, voucher_no)
);

create index vouchers_type_idx on vouchers (voucher_type_id);
create index vouchers_date_idx on vouchers (voucher_date);
create index vouchers_party_idx on vouchers (party_ledger_id);
create index vouchers_status_idx on vouchers (status);
