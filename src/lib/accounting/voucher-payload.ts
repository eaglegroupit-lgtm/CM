import type { TaxType, VoucherStatus } from "@/types/database";

export type LedgerEntryInput = {
  ledger_id: string;
  debit_amount: number;
  credit_amount: number;
  narration?: string;
}

export type InventoryEntryInput = {
  stock_item_id: string;
  lot_id?: string | null;
  new_lot?: { lot_no: string; bundle_no?: string; thickness_mm?: number } | null;
  godown_id: string;
  quantity: number;
  rate: number;
  amount: number;
}

export type TaxDetailInput = {
  tax_type: TaxType;
  taxable_value: number;
  rate: number;
  amount: number;
}

export type CreateVoucherPayload = {
  voucher_type_code: string;
  voucher_date: string;
  party_ledger_id?: string | null;
  reference_no?: string;
  narration?: string;
  place_of_supply?: string;
  is_interstate?: boolean;
  status: VoucherStatus;
  ledger_entries: LedgerEntryInput[];
  inventory_entries?: InventoryEntryInput[];
  tax_details?: TaxDetailInput[];
  new_bill?: { bill_no?: string; due_date?: string } | null;
  bill_allocations?: { bill_id: string; amount: number }[];
}

export function sumDebits(entries: LedgerEntryInput[]): number {
  return entries.reduce((s, e) => s + e.debit_amount, 0);
}

export function sumCredits(entries: LedgerEntryInput[]): number {
  return entries.reduce((s, e) => s + e.credit_amount, 0);
}

export function isBalanced(entries: LedgerEntryInput[]): boolean {
  return Math.abs(sumDebits(entries) - sumCredits(entries)) < 0.005;
}
