"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { CreateVoucherPayload } from "@/lib/accounting/voucher-payload";
import type { LotBalanceRow, OutstandingRow } from "@/types/database";

export async function postVoucher(payload: CreateVoucherPayload, revalidate: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_voucher", { payload });
  if (error) throw new Error(error.message);
  revalidatePath(revalidate);
  revalidatePath("/dashboard");
  return data as string;
}

/** Outstanding bills for a party, used by Payment/Receipt/Debit-Credit note bill allocation. */
export async function getOutstandingBillsForLedger(
  ledgerId: string,
  direction: "receivable" | "payable"
): Promise<OutstandingRow[]> {
  const supabase = await createClient();
  const view = direction === "receivable" ? "outstanding_receivables" : "outstanding_payables";
  const { data, error } = await supabase.from(view).select("*").eq("ledger_id", ledgerId).order("bill_date");
  if (error) throw new Error(error.message);
  return data ?? [];
}

/** Lots with remaining stock for a given item, so Sales/Debit Note can pick a real lot instead of typing a raw ID. */
export async function getAvailableLotsForItem(itemId: string): Promise<LotBalanceRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("lot_balances")
    .select("*")
    .eq("item_id", itemId)
    .gt("remaining_qty", 0)
    .order("lot_no");
  if (error) throw new Error(error.message);
  return data ?? [];
}
