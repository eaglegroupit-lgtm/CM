-- Row Level Security. Writes to transactional data (vouchers and their line items) are
-- funneled through create_voucher()/cancel_voucher() (security definer, role-checked there),
-- so this file mostly governs SELECT (read) access plus direct writes to master data.

alter table company_settings enable row level security;
alter table financial_years enable row level security;
alter table user_profiles enable row level security;
alter table account_groups enable row level security;
alter table ledgers enable row level security;
alter table stock_categories enable row level security;
alter table units_of_measure enable row level security;
alter table godowns enable row level security;
alter table stock_items enable row level security;
alter table stock_lots enable row level security;
alter table stock_ledger_entries enable row level security;
alter table voucher_types enable row level security;
alter table vouchers enable row level security;
alter table voucher_ledger_entries enable row level security;
alter table voucher_inventory_entries enable row level security;
alter table voucher_tax_details enable row level security;
alter table bills enable row level security;
alter table bill_allocations enable row level security;
alter table voucher_counters enable row level security;

-- company_settings: everyone signed in can read; only owner can change company/bank/GST details
create policy company_settings_select on company_settings for select using (auth.uid() is not null);
create policy company_settings_update on company_settings for update using (current_user_role() = 'owner');

-- financial_years: readable by all; managed by owner/accountant
create policy financial_years_select on financial_years for select using (auth.uid() is not null);
create policy financial_years_write on financial_years for all
  using (is_owner_or_accountant()) with check (is_owner_or_accountant());

-- user_profiles: everyone can see their own row; owner manages everyone
create policy user_profiles_select_self on user_profiles for select using (id = auth.uid());
create policy user_profiles_select_owner on user_profiles for select using (current_user_role() = 'owner');
create policy user_profiles_update_self on user_profiles for update using (id = auth.uid()) with check (id = auth.uid());
create policy user_profiles_write_owner on user_profiles for all
  using (current_user_role() = 'owner') with check (current_user_role() = 'owner');

-- Reference/master data: read for all signed-in users, write for owner/accountant only
create policy account_groups_select on account_groups for select using (auth.uid() is not null);
create policy account_groups_write on account_groups for all
  using (is_owner_or_accountant()) with check (is_owner_or_accountant());

create policy ledgers_select on ledgers for select using (auth.uid() is not null);
create policy ledgers_write on ledgers for all
  using (is_owner_or_accountant()) with check (is_owner_or_accountant());

create policy stock_categories_select on stock_categories for select using (auth.uid() is not null);
create policy stock_categories_write on stock_categories for all
  using (is_owner_or_accountant()) with check (is_owner_or_accountant());

create policy units_select on units_of_measure for select using (auth.uid() is not null);
create policy units_write on units_of_measure for all
  using (is_owner_or_accountant()) with check (is_owner_or_accountant());

create policy godowns_select on godowns for select using (auth.uid() is not null);
create policy godowns_write on godowns for all
  using (is_owner_or_accountant()) with check (is_owner_or_accountant());

create policy stock_items_select on stock_items for select using (auth.uid() is not null);
create policy stock_items_write on stock_items for all
  using (is_owner_or_accountant()) with check (is_owner_or_accountant());

create policy stock_lots_select on stock_lots for select using (auth.uid() is not null);
create policy stock_lots_write on stock_lots for all
  using (is_owner_or_accountant()) with check (is_owner_or_accountant());

create policy voucher_types_select on voucher_types for select using (auth.uid() is not null);
create policy voucher_types_write on voucher_types for all
  using (is_owner_or_accountant()) with check (is_owner_or_accountant());

-- Stock ledger entries are only ever written by create_voucher() (security definer);
-- direct client reads are allowed to everyone, direct client writes to no one.
create policy stock_ledger_select on stock_ledger_entries for select using (auth.uid() is not null);

-- Vouchers: owner/accountant see and manage everything. Sales staff only ever see Sales vouchers.
create policy vouchers_select on vouchers for select using (
  is_owner_or_accountant()
  or (
    current_user_role() = 'sales_staff'
    and voucher_type_id in (select id from voucher_types where code = 'SALE')
  )
);

create policy voucher_ledger_entries_select on voucher_ledger_entries for select using (
  is_owner_or_accountant()
  or (
    current_user_role() = 'sales_staff'
    and voucher_id in (
      select v.id from vouchers v
      join voucher_types vt on vt.id = v.voucher_type_id
      where vt.code = 'SALE'
    )
  )
);

create policy voucher_inventory_entries_select on voucher_inventory_entries for select using (
  is_owner_or_accountant()
  or (
    current_user_role() = 'sales_staff'
    and voucher_id in (
      select v.id from vouchers v
      join voucher_types vt on vt.id = v.voucher_type_id
      where vt.code = 'SALE'
    )
  )
);

create policy voucher_tax_details_select on voucher_tax_details for select using (
  is_owner_or_accountant()
  or (
    current_user_role() = 'sales_staff'
    and voucher_id in (
      select v.id from vouchers v
      join voucher_types vt on vt.id = v.voucher_type_id
      where vt.code = 'SALE'
    )
  )
);

-- Bills: owner/accountant full; sales staff can see bills raised from Sales vouchers (to
-- check a customer's outstanding before selling on credit), but not payment allocations.
create policy bills_select on bills for select using (
  is_owner_or_accountant()
  or (
    current_user_role() = 'sales_staff'
    and voucher_id in (
      select v.id from vouchers v
      join voucher_types vt on vt.id = v.voucher_type_id
      where vt.code = 'SALE'
    )
  )
);

create policy bill_allocations_select on bill_allocations for select using (is_owner_or_accountant());

create policy voucher_counters_select on voucher_counters for select using (is_owner_or_accountant());
