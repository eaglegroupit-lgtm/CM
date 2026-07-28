-- Reporting: implemented as SQL functions/views so every report shares one source of truth.
-- All balance calculations use posted vouchers only.

create function ledger_balances(p_as_of date default current_date)
returns table (
  ledger_id uuid,
  name text,
  group_id uuid,
  group_name text,
  nature account_nature,
  party_type party_type,
  signed_balance numeric,
  debit_balance numeric,
  credit_balance numeric
)
language sql
stable
as $$
  select
    l.id,
    l.name,
    l.group_id,
    g.name,
    g.nature,
    l.party_type,
    (case when l.opening_balance_type = 'debit' then l.opening_balance else -l.opening_balance end)
      + coalesce(sum(vle.debit_amount - vle.credit_amount), 0) as signed_balance,
    greatest(
      (case when l.opening_balance_type = 'debit' then l.opening_balance else -l.opening_balance end)
        + coalesce(sum(vle.debit_amount - vle.credit_amount), 0),
      0
    ) as debit_balance,
    greatest(
      -1 * ((case when l.opening_balance_type = 'debit' then l.opening_balance else -l.opening_balance end)
        + coalesce(sum(vle.debit_amount - vle.credit_amount), 0)),
      0
    ) as credit_balance
  from ledgers l
  join account_groups g on g.id = l.group_id
  left join voucher_ledger_entries vle on vle.ledger_id = l.id
  left join vouchers v on v.id = vle.voucher_id and v.status = 'posted' and v.voucher_date <= p_as_of
  group by l.id, g.name, g.nature;
$$;

create function trial_balance(p_as_of date default current_date)
returns table (
  ledger_id uuid,
  name text,
  group_name text,
  debit_balance numeric,
  credit_balance numeric
)
language sql
stable
as $$
  select lb.ledger_id, lb.name, lb.group_name, lb.debit_balance, lb.credit_balance
  from ledger_balances(p_as_of) lb
  where lb.debit_balance <> 0 or lb.credit_balance <> 0
  order by lb.group_name, lb.name;
$$;

-- Profit & Loss for a date range: expense groups show positive spend, income groups show positive earning
create function profit_and_loss(p_from date, p_to date)
returns table (
  nature account_nature,
  group_name text,
  amount numeric
)
language sql
stable
as $$
  select
    g.nature,
    g.name,
    case when g.nature = 'income'
      then sum(vle.credit_amount - vle.debit_amount)
      else sum(vle.debit_amount - vle.credit_amount)
    end as amount
  from voucher_ledger_entries vle
  join ledgers l on l.id = vle.ledger_id
  join account_groups g on g.id = l.group_id
  join vouchers v on v.id = vle.voucher_id
  where v.status = 'posted'
    and v.voucher_date between p_from and p_to
    and g.nature in ('income', 'expense')
  group by g.nature, g.name;
$$;

create function net_profit(p_from date, p_to date)
returns numeric
language sql
stable
as $$
  select coalesce(sum(case when nature = 'income' then amount else -amount end), 0)
  from profit_and_loss(p_from, p_to);
$$;

-- Balance Sheet as of a date; folds current-year net profit into the liabilities/equity side
create function balance_sheet(p_as_of date default current_date)
returns table (
  nature account_nature,
  group_name text,
  amount numeric
)
language plpgsql
stable
as $$
declare
  v_fy_start date;
  v_profit numeric;
begin
  select start_date into v_fy_start from financial_years where is_active limit 1;
  if v_fy_start is null then
    v_fy_start := date_trunc('year', p_as_of)::date;
  end if;
  v_profit := net_profit(v_fy_start, p_as_of);

  return query
  select g.nature, g.name,
    case when g.nature = 'asset' then sum(lb.debit_balance - lb.credit_balance)
         else sum(lb.credit_balance - lb.debit_balance)
    end as amount
  from ledger_balances(p_as_of) lb
  join account_groups g on g.id = lb.group_id
  where g.nature in ('asset', 'liability', 'equity')
  group by g.nature, g.name

  union all

  select 'equity'::account_nature, 'Profit & Loss A/c (Current Year)', v_profit;
end;
$$;

-- Stock summary: on-hand qty/value per item with category and unit names
create view stock_summary as
select
  sb.item_id,
  sb.name,
  sc.name as category_name,
  uom.name as unit_name,
  sb.item_type,
  sb.balance_qty,
  sb.balance_value,
  sb.low_stock_qty,
  (sb.balance_qty <= sb.low_stock_qty) as is_low_stock
from stock_balances sb
join stock_items si on si.id = sb.item_id
join stock_categories sc on sc.id = si.category_id
join units_of_measure uom on uom.id = si.unit_id;

-- Outstanding receivables: unpaid bills against debtor-type parties, from posted vouchers only
create view outstanding_receivables as
select
  bo.bill_id, bo.bill_no, bo.bill_date, bo.due_date,
  l.id as ledger_id, l.name as party_name,
  bo.amount, bo.allocated_amount, bo.outstanding_amount,
  (current_date - bo.due_date) as days_overdue
from bill_outstanding bo
join bills b on b.id = bo.bill_id
join vouchers v on v.id = b.voucher_id
join ledgers l on l.id = bo.ledger_id
where v.status = 'posted'
  and l.party_type in ('debtor', 'both')
  and bo.outstanding_amount > 0;

-- Outstanding payables: unpaid bills against creditor-type parties, from posted vouchers only
create view outstanding_payables as
select
  bo.bill_id, bo.bill_no, bo.bill_date, bo.due_date,
  l.id as ledger_id, l.name as party_name,
  bo.amount, bo.allocated_amount, bo.outstanding_amount,
  (current_date - bo.due_date) as days_overdue
from bill_outstanding bo
join bills b on b.id = bo.bill_id
join vouchers v on v.id = b.voucher_id
join ledgers l on l.id = bo.ledger_id
where v.status = 'posted'
  and l.party_type in ('creditor', 'both')
  and bo.outstanding_amount > 0;

-- Day book: chronological voucher register for a date range
create function day_book(p_from date, p_to date)
returns table (
  voucher_id uuid,
  voucher_no text,
  voucher_date date,
  voucher_type_name text,
  party_name text,
  narration text,
  total_amount numeric,
  status voucher_status
)
language sql
stable
as $$
  select v.id, v.voucher_no, v.voucher_date, vt.name, l.name, v.narration, v.total_amount, v.status
  from vouchers v
  join voucher_types vt on vt.id = v.voucher_type_id
  left join ledgers l on l.id = v.party_ledger_id
  where v.voucher_date between p_from and p_to
  order by v.voucher_date, v.created_at;
$$;

-- Single ledger statement: running balance over time, for the ledger account view report
create function ledger_statement(p_ledger_id uuid, p_from date, p_to date)
returns table (
  voucher_id uuid,
  voucher_no text,
  voucher_date date,
  voucher_type_name text,
  narration text,
  debit_amount numeric,
  credit_amount numeric,
  running_balance numeric
)
language plpgsql
stable
as $$
declare
  v_opening numeric;
begin
  select (case when l.opening_balance_type = 'debit' then l.opening_balance else -l.opening_balance end)
    + coalesce(sum(vle.debit_amount - vle.credit_amount), 0)
  into v_opening
  from ledgers l
  left join voucher_ledger_entries vle on vle.ledger_id = l.id
  left join vouchers v on v.id = vle.voucher_id and v.status = 'posted' and v.voucher_date < p_from
  where l.id = p_ledger_id
  group by l.id, l.opening_balance, l.opening_balance_type;

  return query
  select
    v.id, v.voucher_no, v.voucher_date, vt.name, vle.narration,
    vle.debit_amount, vle.credit_amount,
    coalesce(v_opening, 0) + sum(vle.debit_amount - vle.credit_amount)
      over (order by v.voucher_date, v.created_at rows between unbounded preceding and current row)
  from voucher_ledger_entries vle
  join vouchers v on v.id = vle.voucher_id
  join voucher_types vt on vt.id = v.voucher_type_id
  where vle.ledger_id = p_ledger_id
    and v.status = 'posted'
    and v.voucher_date between p_from and p_to
  order by v.voucher_date, v.created_at;
end;
$$;
