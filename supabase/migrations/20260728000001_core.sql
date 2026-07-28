-- Core: extensions, enums, company settings, financial years, user profiles
create extension if not exists "uuid-ossp";

create type user_role as enum ('owner', 'accountant', 'sales_staff');
create type account_nature as enum ('asset', 'liability', 'income', 'expense', 'equity');
create type balance_side as enum ('debit', 'credit');
create type party_type as enum ('debtor', 'creditor', 'both', 'none');
create type stock_item_type as enum ('slab', 'tile', 'quartz', 'simple');
create type stock_move_type as enum ('in', 'out');
create type lot_status as enum ('in_stock', 'sold', 'reserved');
create type voucher_status as enum ('draft', 'posted', 'cancelled');
create type tax_type as enum ('CGST', 'SGST', 'IGST', 'CESS');

-- Singleton company profile used on invoices, reports, GST calculations
create table company_settings (
  id boolean primary key default true constraint single_row check (id),
  name text not null,
  address text not null,
  city text not null default 'Coimbatore',
  state text not null default 'Tamil Nadu',
  state_code text not null default '33', -- Tamil Nadu GST state code
  pincode text,
  phone text,
  email text,
  gstin text,
  pan text,
  bank_name text,
  bank_account_no text,
  bank_ifsc text,
  bank_branch text,
  logo_url text,
  invoice_terms text,
  updated_at timestamptz not null default now()
);

create table financial_years (
  id uuid primary key default gen_random_uuid(),
  label text not null unique, -- e.g. '2026-27'
  start_date date not null,
  end_date date not null,
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  constraint fy_range check (end_date > start_date)
);

-- Only one financial year may be active at a time
create unique index one_active_financial_year on financial_years (is_active) where is_active;

create table user_profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  role user_role not null default 'sales_staff',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Auto-create a profile row whenever a new auth user signs up
create function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.user_profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.email),
    coalesce((new.raw_user_meta_data ->> 'role')::user_role, 'sales_staff')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Returns null (and therefore fails every role check) for deactivated staff accounts,
-- so toggling user_profiles.is_active off is enough to immediately lock someone out.
create function current_user_role()
returns user_role
language sql
stable
security definer set search_path = public
as $$
  select role from public.user_profiles where id = auth.uid() and is_active;
$$;

create function is_owner_or_accountant()
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select coalesce(current_user_role() in ('owner', 'accountant'), false);
$$;

create function active_financial_year_id()
returns uuid
language sql
stable
security definer set search_path = public
as $$
  select id from public.financial_years where is_active limit 1;
$$;
