"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { CreateVoucherPayload } from "@/lib/accounting/voucher-payload";
import type { OutstandingRow } from "@/types/database";

/**
 * Posts a voucher via the create_voucher RPC. The shop runs a single stock location, so the
 * forms never pick a godown — every inventory line is stamped with the default godown here.
 */
export async function postVoucher(payload: CreateVoucherPayload, revalidate: string) {
  const supabase = await createClient();

  if (payload.inventory_entries && payload.inventory_entries.length > 0) {
    const { data: godowns, error: godownError } = await supabase.from("godowns").select("id, is_default");
    if (godownError) throw new Error(godownError.message);
    const godownId = godowns?.find((g) => g.is_default)?.id ?? godowns?.[0]?.id;
    if (!godownId) throw new Error("No stock location configured — run supabase/seed.sql");
    payload = {
      ...payload,
      inventory_entries: payload.inventory_entries.map((e) => ({ ...e, godown_id: e.godown_id ?? godownId })),
    };
  }

  const { data, error } = await supabase.rpc("create_voucher", { payload });
  if (error) throw new Error(error.message);
  revalidatePath(revalidate);
  revalidatePath("/dashboard");
  return data as string;
}

/** Outstanding bills for a party, used by Money Received / Money Paid / Returns bill allocation. */
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
