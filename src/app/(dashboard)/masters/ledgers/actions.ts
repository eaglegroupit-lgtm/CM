"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { BalanceSide } from "@/types/database";

/** Plain-language account kinds mapped onto the Tally-standard groups seeded in supabase/seed.sql. */
const KINDS = {
  bank: { group: "Bank Accounts", side: "debit" },
  cash: { group: "Cash-in-Hand", side: "debit" },
  expense: { group: "Indirect Expenses", side: "debit" },
  income: { group: "Indirect Incomes", side: "credit" },
  capital: { group: "Capital Account", side: "credit" },
  loan: { group: "Unsecured Loans", side: "credit" },
} as const satisfies Record<string, { group: string; side: BalanceSide }>;

export type AccountKind = keyof typeof KINDS;

export interface AccountInput {
  name: string;
  kind: AccountKind;
  opening_balance: number;
  bank_account_no?: string;
  bank_ifsc?: string;
}

export async function createAccount(input: AccountInput) {
  const supabase = await createClient();
  const kind = KINDS[input.kind];
  const { data: group, error: groupError } = await supabase
    .from("account_groups")
    .select("id")
    .eq("name", kind.group)
    .single();
  if (groupError || !group) throw new Error(`"${kind.group}" group not found — run supabase/seed.sql`);

  const { error } = await supabase.from("ledgers").insert({
    name: input.name,
    group_id: group.id,
    party_type: "none",
    opening_balance: input.opening_balance,
    opening_balance_type: kind.side,
    bank_account_no: input.bank_account_no || null,
    bank_ifsc: input.bank_ifsc || null,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/masters/ledgers");
  revalidatePath("/vouchers", "layout");
}
