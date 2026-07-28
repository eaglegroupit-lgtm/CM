"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { CompanySettings } from "@/types/database";

export async function updateCompanySettings(input: Partial<CompanySettings>) {
  const supabase = await createClient();
  const { error } = await supabase.from("company_settings").update(input).eq("id", true);
  if (error) throw new Error(error.message);
  revalidatePath("/settings/company");
}
