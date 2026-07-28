"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { AccountNature, BalanceSide } from "@/types/database";

export interface GroupInput {
  name: string;
  parent_group_id: string | null;
  nature: AccountNature;
  normal_balance: BalanceSide;
}

export async function createGroup(input: GroupInput) {
  const supabase = await createClient();
  const { error } = await supabase.from("account_groups").insert({
    name: input.name,
    parent_group_id: input.parent_group_id,
    nature: input.nature,
    normal_balance: input.normal_balance,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/masters/groups");
}
