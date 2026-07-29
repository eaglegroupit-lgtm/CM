"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface CustomerInput {
  name: string;
  phone?: string;
  address?: string;
  state?: string;
  gstin?: string;
  credit_limit?: number;
  credit_days?: number;
  opening_balance?: number;
}

export async function createCustomer(input: CustomerInput) {
  const supabase = await createClient();

  const { data: group, error: groupError } = await supabase
    .from("account_groups")
    .select("id")
    .eq("name", "Sundry Debtors")
    .single();
  if (groupError || !group) throw new Error("Sundry Debtors group not found — run supabase/seed.sql");

  const { error } = await supabase.from("ledgers").insert({
    ...input,
    group_id: group.id,
    party_type: "debtor",
    opening_balance: input.opening_balance ?? 0,
    opening_balance_type: "debit",
  });
  if (error) throw new Error(error.message);
  revalidatePath("/masters/customers");
}
