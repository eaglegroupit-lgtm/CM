"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createGodown(input: { name: string; address?: string }) {
  const supabase = await createClient();
  const { error } = await supabase.from("godowns").insert(input);
  if (error) throw new Error(error.message);
  revalidatePath("/masters/godowns");
}
