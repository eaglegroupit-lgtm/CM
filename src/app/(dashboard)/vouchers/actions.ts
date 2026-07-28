"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { CreateVoucherPayload } from "@/lib/accounting/voucher-payload";
import type { OutstandingRow } from "@/types/database";

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
