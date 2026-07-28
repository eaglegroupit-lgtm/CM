"use server";

import { createClient } from "@/lib/supabase/server";

export interface LoginResult {
  error?: string;
}

export async function login(formData: FormData): Promise<LoginResult> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: error.message };
  }

  return {};
}
