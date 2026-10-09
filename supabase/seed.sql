-- Seed data for a hardware & plywood shop
-- Safe to re-run: every insert is guarded with on conflict do nothing / where not exists.

insert into company_settings (id, name, address, city, state, state_code, pincode, phone, invoice_terms)
values (
  true,
  'My Hardware & Plywoods',
  'Shop address (edit in Settings -> Shop Details)',
  'Coimbatore', 'Tamil Nadu', '33', '', '',
  'Goods once sold will not be taken back or exchanged. Subject to local jurisdiction.'
)
on conflict (id) do nothing;

insert into financial_years (label, start_date, end_date, is_active)
values ('2026-27', '2026-04-01', '2027-03-31', true)
on conflict (label) do nothing;

-- Tally-standard chart of accounts (primary groups)
insert into account_groups (name, parent_group_id, nature, normal_balance, is_system) values
  ('Capital Account', null, 'equity', 'credit', true),
  ('Loans (Liability)', null, 'liability', 'credit', true),
  ('Current Liabilities', null, 'liability', 'credit', true),
  ('Fixed Assets', null, 'asset', 'debit', true),
  ('Investments', null, 'asset', 'debit', true),
  ('Current Assets', null, 'asset', 'debit', true),
  ('Branch / Divisions', null, 'asset', 'debit', true),
  ('Misc. Expenses (Asset)', null, 'asset', 'debit', true),
  ('Suspense A/c', null, 'asset', 'debit', true),
  ('Sales Accounts', null, 'income', 'credit', true),
  ('Purchase Accounts', null, 'expense', 'debit', true),
  ('Direct Incomes', null, 'income', 'credit', true),
  ('Direct Expenses', null, 'expense', 'debit', true),
  ('Indirect Incomes', null, 'income', 'credit', true),
  ('Indirect Expenses', null, 'expense', 'debit', true)
on conflict (name) do nothing;

-- Subgroups (nature/normal_balance cast explicitly: a bare string literal union'd across
-- branches resolves to text, which postgres will not implicitly cast to the enum columns)
insert into account_groups (name, parent_group_id, nature, normal_balance, is_system)
select 'Secured Loans', id, 'liability'::account_nature, 'credit'::balance_side, true from account_groups where name = 'Loans (Liability)'
union all
select 'Unsecured Loans', id, 'liability'::account_nature, 'credit'::balance_side, true from account_groups where name = 'Loans (Liability)'
union all
select 'Bank OD Account', id, 'liability'::account_nature, 'credit'::balance_side, true from account_groups where name = 'Loans (Liability)'
union all
select 'Duties & Taxes', id, 'liability'::account_nature, 'credit'::balance_side, true from account_groups where name = 'Current Liabilities'
union all
select 'Provisions', id, 'liability'::account_nature, 'credit'::balance_side, true from account_groups where name = 'Current Liabilities'
union all
select 'Sundry Creditors', id, 'liability'::account_nature, 'credit'::balance_side, true from account_groups where name = 'Current Liabilities'
union all
select 'Bank Accounts', id, 'asset'::account_nature, 'debit'::balance_side, true from account_groups where name = 'Current Assets'
union all
select 'Cash-in-Hand', id, 'asset'::account_nature, 'debit'::balance_side, true from account_groups where name = 'Current Assets'
union all
select 'Deposits (Asset)', id, 'asset'::account_nature, 'debit'::balance_side, true from account_groups where name = 'Current Assets'
union all
select 'Loans & Advances (Asset)', id, 'asset'::account_nature, 'debit'::balance_side, true from account_groups where name = 'Current Assets'
union all
select 'Stock-in-Hand', id, 'asset'::account_nature, 'debit'::balance_side, true from account_groups where name = 'Current Assets'
union all
select 'Sundry Debtors', id, 'asset'::account_nature, 'debit'::balance_side, true from account_groups where name = 'Current Assets'
on conflict (name) do nothing;

-- Default ledgers
insert into ledgers (name, group_id, opening_balance, opening_balance_type, party_type)
select 'Cash', id, 0, 'debit', 'none' from account_groups where name = 'Cash-in-Hand'
on conflict (name) do nothing;

insert into ledgers (name, group_id, opening_balance, opening_balance_type, party_type)
select 'Sales Account', id, 0, 'credit', 'none' from account_groups where name = 'Sales Accounts'
on conflict (name) do nothing;

insert into ledgers (name, group_id, opening_balance, opening_balance_type, party_type)
select 'Purchase Account', id, 0, 'debit', 'none' from account_groups where name = 'Purchase Accounts'
on conflict (name) do nothing;

insert into ledgers (name, group_id, opening_balance, opening_balance_type, party_type)
select x.name, g.id, 0, 'credit', 'none'
from account_groups g,
  (values ('Output CGST'), ('Output SGST'), ('Output IGST')) as x(name)
where g.name = 'Duties & Taxes'
on conflict (name) do nothing;

insert into ledgers (name, group_id, opening_balance, opening_balance_type, party_type)
select x.name, g.id, 0, 'debit', 'none'
from account_groups g,
  (values ('Input CGST'), ('Input SGST'), ('Input IGST')) as x(name)
where g.name = 'Duties & Taxes'
on conflict (name) do nothing;

insert into ledgers (name, group_id, opening_balance, opening_balance_type, party_type)
select 'Round Off', id, 0, 'debit', 'none' from account_groups where name = 'Indirect Expenses'
on conflict (name) do nothing;

insert into ledgers (name, group_id, opening_balance, opening_balance_type, party_type)
select 'Discount Allowed', id, 0, 'debit', 'none' from account_groups where name = 'Indirect Expenses'
on conflict (name) do nothing;

insert into ledgers (name, group_id, opening_balance, opening_balance_type, party_type)
select 'Discount Received', id, 0, 'credit', 'none' from account_groups where name = 'Indirect Incomes'
on conflict (name) do nothing;

-- Everyday accounts a shop needs: a bank account, common expense heads and a walk-in customer
insert into ledgers (name, group_id, opening_balance, opening_balance_type, party_type)
select 'Bank Account', id, 0, 'debit', 'none' from account_groups where name = 'Bank Accounts'
on conflict (name) do nothing;

insert into ledgers (name, group_id, opening_balance, opening_balance_type, party_type)
select x.name, g.id, 0, 'debit', 'none'
from account_groups g,
  (values ('Shop Rent'), ('Staff Salary'), ('Electricity Bill'), ('Transport & Freight'),
          ('Loading & Unloading'), ('Tea & Refreshments'), ('Telephone & Internet'), ('Other Expenses')) as x(name)
where g.name = 'Indirect Expenses'
on conflict (name) do nothing;

insert into ledgers (name, group_id, opening_balance, opening_balance_type, party_type, state)
select 'Walk-in Customer', id, 0, 'debit', 'debtor', 'Tamil Nadu' from account_groups where name = 'Sundry Debtors'
on conflict (name) do nothing;

-- Stock categories for a hardware & plywood shop
insert into stock_categories (name) values
  ('Plywood'), ('Block Board'), ('MDF / HDF / Particle Board'), ('Laminates & Veneers'),
  ('Doors'), ('Hinges & Channels'), ('Handles, Knobs & Locks'), ('Screws, Nails & Bolts'),
  ('Adhesives & Polish'), ('Kitchen & Wardrobe Fittings'), ('Edge Band & Profiles'),
  ('Tools'), ('Other')
on conflict (name) do nothing;

insert into units_of_measure (name, symbol) values
  ('Nos', 'Nos'), ('Pcs', 'Pcs'), ('Sheet', 'Sheet'), ('Sq.ft', 'Sqft'), ('Box', 'Box'),
  ('Packet', 'Pkt'), ('Set', 'Set'), ('Pair', 'Pair'), ('Kg', 'Kg'), ('Litre', 'Ltr'),
  ('Metre', 'Mtr'), ('Roll', 'Roll')
on conflict (name) do nothing;

insert into godowns (name, is_default) values ('Main Godown', true)
on conflict (name) do nothing;

-- Voucher types
insert into voucher_types (code, name, numbering_prefix, affects_inventory, affects_tax, requires_party, sort_order) values
  ('SALE', 'Sales', 'SAL', true, true, true, 1),
  ('PURC', 'Purchase', 'PUR', true, true, true, 2),
  ('PMT', 'Payment', 'PMT', false, false, false, 3),
  ('RCPT', 'Receipt', 'RCT', false, false, false, 4),
  ('JRNL', 'Journal', 'JNL', false, false, false, 5),
  ('CONT', 'Contra', 'CON', false, false, false, 6),
  ('DNOTE', 'Debit Note', 'DN', true, true, true, 7),
  ('CNOTE', 'Credit Note', 'CN', true, true, true, 8),
  ('SORD', 'Sales Order', 'SO', true, false, true, 9),
  ('STJR', 'Stock Journal', 'STJ', true, false, false, 10)
on conflict (code) do nothing;
