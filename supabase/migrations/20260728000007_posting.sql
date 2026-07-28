-- Per (voucher_type, financial_year) sequence counters, incremented atomically
create table voucher_counters (
  voucher_type_id uuid not null references voucher_types (id),
  financial_year_id uuid not null references financial_years (id),
  last_number integer not null default 0,
  primary key (voucher_type_id, financial_year_id)
);

-- Keep stock_lots.status in sync with remaining_qty after every stock movement
create function sync_lot_status()
returns trigger
language plpgsql
as $$
declare
  v_remaining numeric(14, 2);
begin
  if new.lot_id is not null then
    select remaining_qty into v_remaining from lot_balances where lot_id = new.lot_id;
    update stock_lots
      set status = case when v_remaining <= 0 then 'sold' else 'in_stock' end
      where id = new.lot_id and status <> 'reserved';
  end if;
  return new;
end;
$$;

create trigger stock_ledger_sync_lot_status
  after insert on stock_ledger_entries
  for each row execute function sync_lot_status();

-- Single entry point the app calls (via supabase.rpc) to post any voucher type as one
-- atomic transaction: header + ledger lines + inventory lines + tax lines + bill effects.
-- Expected payload shape (see /src/lib/accounting/voucher-payload.ts on the app side):
-- {
--   voucher_type_code, voucher_date, party_ledger_id, reference_no, narration,
--   place_of_supply, is_interstate, status,
--   ledger_entries: [{ ledger_id, debit_amount, credit_amount, narration }],
--   inventory_entries: [{ stock_item_id, lot_id, new_lot, godown_id, quantity, rate, amount }],
--   tax_details: [{ tax_type, taxable_value, rate, amount }],
--   new_bill: { bill_no, due_date },
--   bill_allocations: [{ bill_id, amount }]
-- }
create function create_voucher(payload jsonb)
returns uuid
language plpgsql
security definer set search_path = public
as $$
declare
  v_type_id uuid;
  v_prefix text;
  v_affects_inventory boolean;
  v_affects_tax boolean;
  v_fy_id uuid;
  v_fy_label text;
  v_seq integer;
  v_voucher_no text;
  v_voucher_id uuid;
  v_total numeric(14, 2) := 0;
  v_move_type stock_move_type;
  v_entry jsonb;
  v_lot_id uuid;
  v_status voucher_status;
  v_type_code text;
  v_role user_role;
begin
  -- This function runs as security definer (bypassing RLS on the tables it touches) so it
  -- must enforce role authorization itself: only owner/accountant may post any voucher type,
  -- sales_staff may only post Sales vouchers (their read access is separately capped by RLS).
  v_role := current_user_role();
  if v_role is null then
    raise exception 'Not authorized';
  end if;

  v_type_code := payload ->> 'voucher_type_code';

  if v_role = 'sales_staff' and v_type_code not in ('SALE') then
    raise exception 'Sales staff may only create Sales vouchers';
  end if;

  select id, numbering_prefix, affects_inventory, affects_tax
    into v_type_id, v_prefix, v_affects_inventory, v_affects_tax
    from voucher_types where code = v_type_code;

  if v_type_id is null then
    raise exception 'Unknown voucher type code: %', v_type_code;
  end if;

  v_fy_id := active_financial_year_id();
  if v_fy_id is null then
    raise exception 'No active financial year is configured';
  end if;
  select label into v_fy_label from financial_years where id = v_fy_id;

  insert into voucher_counters (voucher_type_id, financial_year_id, last_number)
    values (v_type_id, v_fy_id, 1)
    on conflict (voucher_type_id, financial_year_id)
    do update set last_number = voucher_counters.last_number + 1
    returning last_number into v_seq;

  v_voucher_no := v_prefix || '/' || v_fy_label || '/' || lpad(v_seq::text, 4, '0');

  insert into vouchers (
    voucher_type_id, voucher_no, voucher_date, financial_year_id,
    party_ledger_id, reference_no, narration, place_of_supply, is_interstate,
    status, created_by
  ) values (
    v_type_id, v_voucher_no, coalesce((payload ->> 'voucher_date')::date, current_date), v_fy_id,
    nullif(payload ->> 'party_ledger_id', '')::uuid,
    payload ->> 'reference_no', payload ->> 'narration', payload ->> 'place_of_supply',
    coalesce((payload ->> 'is_interstate')::boolean, false),
    'draft', auth.uid()
  ) returning id into v_voucher_id;

  -- Ledger lines (double entry)
  for v_entry in select * from jsonb_array_elements(coalesce(payload -> 'ledger_entries', '[]'::jsonb))
  loop
    insert into voucher_ledger_entries (voucher_id, ledger_id, debit_amount, credit_amount, narration)
    values (
      v_voucher_id,
      (v_entry ->> 'ledger_id')::uuid,
      coalesce((v_entry ->> 'debit_amount')::numeric, 0),
      coalesce((v_entry ->> 'credit_amount')::numeric, 0),
      v_entry ->> 'narration'
    );
    v_total := v_total + coalesce((v_entry ->> 'debit_amount')::numeric, 0);
  end loop;

  -- Inventory lines + resulting stock movements
  if v_affects_inventory then
    v_move_type := case v_type_code
      when 'SALE' then 'out'
      when 'PURC' then 'in'
      when 'CNOTE' then 'in'
      when 'DNOTE' then 'out'
      else 'out'
    end;

    for v_entry in select * from jsonb_array_elements(coalesce(payload -> 'inventory_entries', '[]'::jsonb))
    loop
      v_lot_id := nullif(v_entry ->> 'lot_id', '')::uuid;

      if v_lot_id is null and v_entry -> 'new_lot' is not null and v_entry -> 'new_lot' <> 'null' then
        insert into stock_lots (item_id, lot_no, bundle_no, thickness_mm, godown_id, total_qty, rate)
        values (
          (v_entry ->> 'stock_item_id')::uuid,
          v_entry -> 'new_lot' ->> 'lot_no',
          v_entry -> 'new_lot' ->> 'bundle_no',
          nullif(v_entry -> 'new_lot' ->> 'thickness_mm', '')::numeric,
          (v_entry ->> 'godown_id')::uuid,
          (v_entry ->> 'quantity')::numeric,
          (v_entry ->> 'rate')::numeric
        ) returning id into v_lot_id;
      end if;

      insert into voucher_inventory_entries (voucher_id, stock_item_id, lot_id, godown_id, quantity, rate, amount)
      values (
        v_voucher_id, (v_entry ->> 'stock_item_id')::uuid, v_lot_id, (v_entry ->> 'godown_id')::uuid,
        (v_entry ->> 'quantity')::numeric, (v_entry ->> 'rate')::numeric, (v_entry ->> 'amount')::numeric
      );

      insert into stock_ledger_entries (voucher_id, item_id, lot_id, godown_id, move_type, quantity, rate, amount, entry_date)
      values (
        v_voucher_id, (v_entry ->> 'stock_item_id')::uuid, v_lot_id, (v_entry ->> 'godown_id')::uuid,
        v_move_type, (v_entry ->> 'quantity')::numeric, (v_entry ->> 'rate')::numeric, (v_entry ->> 'amount')::numeric,
        coalesce((payload ->> 'voucher_date')::date, current_date)
      );
    end loop;
  end if;

  -- GST tax lines (reporting only; the tax ledger accounts themselves are in ledger_entries)
  if v_affects_tax then
    for v_entry in select * from jsonb_array_elements(coalesce(payload -> 'tax_details', '[]'::jsonb))
    loop
      insert into voucher_tax_details (voucher_id, tax_type, taxable_value, rate, amount)
      values (
        v_voucher_id, (v_entry ->> 'tax_type')::tax_type,
        (v_entry ->> 'taxable_value')::numeric, (v_entry ->> 'rate')::numeric, (v_entry ->> 'amount')::numeric
      );
    end loop;
  end if;

  -- New outstanding bill raised against the party (Sales / Purchase / Debit Note / Credit Note)
  if payload -> 'new_bill' is not null and payload -> 'new_bill' <> 'null' then
    insert into bills (voucher_id, ledger_id, bill_no, bill_date, due_date, amount)
    values (
      v_voucher_id,
      (payload ->> 'party_ledger_id')::uuid,
      coalesce(payload -> 'new_bill' ->> 'bill_no', v_voucher_no),
      coalesce((payload ->> 'voucher_date')::date, current_date),
      nullif(payload -> 'new_bill' ->> 'due_date', '')::date,
      v_total
    );
  end if;

  -- Settling existing bills (Payment / Receipt against earlier Sales / Purchase bills)
  if payload -> 'bill_allocations' is not null then
    for v_entry in select * from jsonb_array_elements(coalesce(payload -> 'bill_allocations', '[]'::jsonb))
    loop
      insert into bill_allocations (voucher_id, bill_id, amount)
      values (v_voucher_id, (v_entry ->> 'bill_id')::uuid, (v_entry ->> 'amount')::numeric);

      update bills set is_closed = true
        where id = (v_entry ->> 'bill_id')::uuid
        and (select outstanding_amount from bill_outstanding where bill_id = bills.id) <= 0;
    end loop;
  end if;

  update vouchers set total_amount = v_total, updated_at = now() where id = v_voucher_id;

  v_status := coalesce(payload ->> 'status', 'draft')::voucher_status;
  if v_status = 'posted' then
    update vouchers set status = 'posted' where id = v_voucher_id;
  end if;

  return v_voucher_id;
end;
$$;

-- Cancel a posted voucher (soft-cancel; reporting views exclude non-posted vouchers).
-- Reversing stock/ledger entries automatically is out of scope for this MVP: cancelling
-- simply removes the voucher from reports, it does not generate reversing entries.
create function cancel_voucher(p_voucher_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_role user_role;
  v_type_code text;
begin
  v_role := current_user_role();
  select vt.code into v_type_code
    from vouchers v join voucher_types vt on vt.id = v.voucher_type_id
    where v.id = p_voucher_id;

  if v_role not in ('owner', 'accountant') then
    raise exception 'Only owner/accountant may cancel vouchers';
  end if;

  update vouchers set status = 'cancelled', updated_at = now() where id = p_voucher_id;
end;
$$;
