"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { BalanceSide, PartyType } from "@/types/database";

export interface LedgerInput {
  name: string;
  group_id: string;
  opening_balance: number;
  opening_balance_type: BalanceSide;
  party_type: PartyType;
  gstin?: string;
  address?: string;
  state?: string;
  phone?: string;
  email?: string;
  credit_limit?: number;
  credit_days?: number;
}

export async function createLedger(input: LedgerInput) {
  const supabase = await createClient();
  const { error } = await supabase.from("ledgers").insert(input);
  if (error) throw new Error(error.message);
  revalidatePath("/masters/ledgers");
}
