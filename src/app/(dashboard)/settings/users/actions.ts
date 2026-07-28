"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth";
import type { UserRole } from "@/types/database";

export async function createStaffUser(input: { email: string; password: string; full_name: string; role: UserRole }) {
  await requireRole(["owner"]);
  const admin = createAdminClient();

  const { error } = await admin.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: true,
    user_metadata: { full_name: input.full_name, role: input.role },
  });

  if (error) throw new Error(error.message);
  revalidatePath("/settings/users");
}

export async function updateUserRole(userId: string, role: UserRole) {
  await requireRole(["owner"]);
  const supabase = await createClient();
  const { error } = await supabase.from("user_profiles").update({ role }).eq("id", userId);
  if (error) throw new Error(error.message);
  revalidatePath("/settings/users");
}

export async function toggleUserActive(userId: string, isActive: boolean) {
  await requireRole(["owner"]);
  const supabase = await createClient();
  const { error } = await supabase.from("user_profiles").update({ is_active: isActive }).eq("id", userId);
  if (error) throw new Error(error.message);
  revalidatePath("/settings/users");
}
