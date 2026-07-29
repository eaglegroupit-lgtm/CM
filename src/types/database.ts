// Hand-written to match supabase/migrations/*.sql. Once the project is deployed, prefer
// regenerating with: npx supabase gen types typescript --project-id <ref> > src/types/database.ts

export type UserRole = "owner" | "accountant" | "sales_staff";
export type AccountNature = "asset" | "liability" | "income" | "expense" | "equity";
export type BalanceSide = "debit" | "credit";
export type PartyType = "debtor" | "creditor" | "both" | "none";
export type StockItemType = "slab" | "tile" | "quartz" | "simple";
export type StockMoveType = "in" | "out";
export type LotStatus = "in_stock" | "sold" | "reserved";
export type VoucherStatus = "draft" | "posted" | "cancelled";
export type TaxType = "CGST" | "SGST" | "IGST" | "CESS";

export type CompanySettings = {
  id: boolean;
  name: string;
  address: string;
  city: string;
  state: string;
  state_code: string;
  pincode: string | null;
  phone: string | null;
  email: string | null;
  gstin: string | null;
  pan: string | null;
  bank_name: string | null;
  bank_account_no: string | null;
  bank_ifsc: string | null;
  bank_branch: string | null;
  logo_url: string | null;
  invoice_terms: string | null;
  updated_at: string;
}

export type FinancialYear = {
  id: string;
  label: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
}

export type UserProfile = {
  id: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

export type AccountGroup = {
  id: string;
  name: string;
  parent_group_id: string | null;
  nature: AccountNature;
  normal_balance: BalanceSide;
  is_system: boolean;
  created_at: string;
}

export type Ledger = {
  id: string;
  name: string;
  group_id: string;
  opening_balance: number;
  opening_balance_type: BalanceSide;
  gstin: string | null;
  address: string | null;
  state: string | null;
  phone: string | null;
  email: string | null;
  party_type: PartyType;
  credit_limit: number | null;
  credit_days: number | null;
  bank_account_no: string | null;
  bank_ifsc: string | null;
  is_active: boolean;
  created_at: string;
}

export type StockCategory = {
  id: string;
  name: string;
}

export type UnitOfMeasure = {
  id: string;
  name: string;
  symbol: string;
}

export type Godown = {
  id: string;
  name: string;
  address: string | null;
  is_default: boolean;
}

export type StockItem = {
  id: string;
  name: string;
  category_id: string;
  item_type: StockItemType;
  unit_id: string;
  hsn_code: string | null;
  gst_rate: number;
  standard_rate: number;
  low_stock_qty: number;
  tracks_lots: boolean;
  thickness_mm: number | null;
  finish: string | null;
  color: string | null;
  size: string | null;
  brand: string | null;
  opening_qty: number;
  opening_value: number;
  is_active: boolean;
  created_at: string;
}

export type StockLot = {
  id: string;
  item_id: string;
  lot_no: string;
  bundle_no: string | null;
  thickness_mm: number | null;
  godown_id: string;
  purchase_voucher_id: string | null;
  total_qty: number;
  rate: number;
  status: LotStatus;
  created_at: string;
}

export type VoucherType = {
  id: string;
  code: string;
  name: string;
  numbering_prefix: string;
  affects_inventory: boolean;
  affects_tax: boolean;
  requires_party: boolean;
  sort_order: number;
}

export type Voucher = {
  id: string;
  voucher_type_id: string;
  voucher_no: string;
  voucher_date: string;
  financial_year_id: string;
  party_ledger_id: string | null;
  reference_no: string | null;
  narration: string | null;
  place_of_supply: string | null;
  is_interstate: boolean;
  status: VoucherStatus;
  total_amount: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export type VoucherLedgerEntry = {
  id: string;
  voucher_id: string;
  ledger_id: string;
  debit_amount: number;
  credit_amount: number;
  narration: string | null;
  sort_order: number;
}

export type VoucherInventoryEntry = {
  id: string;
  voucher_id: string;
  stock_item_id: string;
  lot_id: string | null;
  godown_id: string;
  quantity: number;
  rate: number;
  amount: number;
  sort_order: number;
}

export type VoucherTaxDetail = {
  id: string;
  voucher_id: string;
  tax_type: TaxType;
  taxable_value: number;
  rate: number;
  amount: number;
}

export type Bill = {
  id: string;
  voucher_id: string;
  ledger_id: string;
  bill_no: string;
  bill_date: string;
  due_date: string | null;
  amount: number;
  is_closed: boolean;
  created_at: string;
}

export type BillAllocation = {
  id: string;
  voucher_id: string;
  bill_id: string;
  amount: number;
}

// --- Views ---

export type StockSummaryRow = {
  item_id: string;
  name: string;
  category_name: string;
  unit_name: string;
  item_type: StockItemType;
  balance_qty: number;
  balance_value: number;
  low_stock_qty: number;
  is_low_stock: boolean;
}

export type LotBalanceRow = {
  lot_id: string;
  item_id: string;
  lot_no: string;
  bundle_no: string | null;
  godown_id: string;
  rate: number;
  status: LotStatus;
  total_qty: number;
  remaining_qty: number;
}

export type OutstandingRow = {
  bill_id: string;
  bill_no: string;
  bill_date: string;
  due_date: string | null;
  ledger_id: string;
  party_name: string;
  amount: number;
  allocated_amount: number;
  outstanding_amount: number;
  days_overdue: number | null;
}

export type LedgerWithNature = Ledger & {
  group_name: string;
  nature: AccountNature;
  normal_balance: BalanceSide;
};

// --- Function return rows ---

export type LedgerBalanceRow = {
  ledger_id: string;
  name: string;
  group_id: string;
  group_name: string;
  nature: AccountNature;
  party_type: PartyType;
  signed_balance: number;
  debit_balance: number;
  credit_balance: number;
}

export type TrialBalanceRow = {
  ledger_id: string;
  name: string;
  group_name: string;
  debit_balance: number;
  credit_balance: number;
}

export type ProfitAndLossRow = {
  nature: AccountNature;
  group_name: string;
  amount: number;
}

export type BalanceSheetRow = {
  nature: AccountNature;
  group_name: string;
  amount: number;
}

export type DayBookRow = {
  voucher_id: string;
  voucher_no: string;
  voucher_date: string;
  voucher_type_name: string;
  party_name: string | null;
  narration: string | null;
  total_amount: number;
  status: VoucherStatus;
}

export type LedgerStatementRow = {
  voucher_id: string;
  voucher_no: string;
  voucher_date: string;
  voucher_type_name: string;
  narration: string | null;
  debit_amount: number;
  credit_amount: number;
  running_balance: number;
}

// GenericTable/GenericView from @supabase/postgrest-js require a Relationships array
// (even when empty) or the whole select/query type resolves to `never`. We don't model
// foreign-key relationships here, so embedded-resource joins (`select("foo(*)")`) aren't
// typed — write those queries as plain column selects instead.
type NoRelationships = { Relationships: [] };

export type Database = {
  public: {
    Tables: {
      company_settings: { Row: CompanySettings; Insert: Partial<CompanySettings>; Update: Partial<CompanySettings> } & NoRelationships;
      financial_years: { Row: FinancialYear; Insert: Partial<FinancialYear>; Update: Partial<FinancialYear> } & NoRelationships;
      user_profiles: { Row: UserProfile; Insert: Partial<UserProfile>; Update: Partial<UserProfile> } & NoRelationships;
      account_groups: { Row: AccountGroup; Insert: Partial<AccountGroup>; Update: Partial<AccountGroup> } & NoRelationships;
      ledgers: { Row: Ledger; Insert: Partial<Ledger>; Update: Partial<Ledger> } & NoRelationships;
      stock_categories: { Row: StockCategory; Insert: Partial<StockCategory>; Update: Partial<StockCategory> } & NoRelationships;
      units_of_measure: { Row: UnitOfMeasure; Insert: Partial<UnitOfMeasure>; Update: Partial<UnitOfMeasure> } & NoRelationships;
      godowns: { Row: Godown; Insert: Partial<Godown>; Update: Partial<Godown> } & NoRelationships;
      stock_items: { Row: StockItem; Insert: Partial<StockItem>; Update: Partial<StockItem> } & NoRelationships;
      stock_lots: { Row: StockLot; Insert: Partial<StockLot>; Update: Partial<StockLot> } & NoRelationships;
      voucher_types: { Row: VoucherType; Insert: Partial<VoucherType>; Update: Partial<VoucherType> } & NoRelationships;
      vouchers: { Row: Voucher; Insert: Partial<Voucher>; Update: Partial<Voucher> } & NoRelationships;
      voucher_ledger_entries: { Row: VoucherLedgerEntry; Insert: Partial<VoucherLedgerEntry>; Update: Partial<VoucherLedgerEntry> } & NoRelationships;
      voucher_inventory_entries: { Row: VoucherInventoryEntry; Insert: Partial<VoucherInventoryEntry>; Update: Partial<VoucherInventoryEntry> } & NoRelationships;
      voucher_tax_details: { Row: VoucherTaxDetail; Insert: Partial<VoucherTaxDetail>; Update: Partial<VoucherTaxDetail> } & NoRelationships;
      bills: { Row: Bill; Insert: Partial<Bill>; Update: Partial<Bill> } & NoRelationships;
      bill_allocations: { Row: BillAllocation; Insert: Partial<BillAllocation>; Update: Partial<BillAllocation> } & NoRelationships;
    };
    Views: {
      stock_summary: { Row: StockSummaryRow } & NoRelationships;
      lot_balances: { Row: LotBalanceRow } & NoRelationships;
      outstanding_receivables: { Row: OutstandingRow } & NoRelationships;
      outstanding_payables: { Row: OutstandingRow } & NoRelationships;
      ledger_with_nature: { Row: LedgerWithNature } & NoRelationships;
    };
    Functions: {
      create_voucher: { Args: { payload: Record<string, unknown> }; Returns: string };
      cancel_voucher: { Args: { p_voucher_id: string }; Returns: void };
      ledger_balances: { Args: { p_as_of?: string }; Returns: LedgerBalanceRow[] };
      trial_balance: { Args: { p_as_of?: string }; Returns: TrialBalanceRow[] };
      profit_and_loss: { Args: { p_from: string; p_to: string }; Returns: ProfitAndLossRow[] };
      balance_sheet: { Args: { p_as_of?: string }; Returns: BalanceSheetRow[] };
      net_profit: { Args: { p_from: string; p_to: string }; Returns: number };
      day_book: { Args: { p_from: string; p_to: string }; Returns: DayBookRow[] };
      ledger_statement: { Args: { p_ledger_id: string; p_from: string; p_to: string }; Returns: LedgerStatementRow[] };
    };
  };
}
