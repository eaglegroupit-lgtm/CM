import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { UserProfile } from "@/types/database";

export async function getCurrentProfile(): Promise<{ userId: string; email: string; profile: UserProfile }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) {
    redirect("/login");
  }

  return { userId: user.id, email: user.email ?? "", profile };
}

/** Redirects away from a page if the current user's role isn't in `roles`. */
export async function requireRole(roles: UserProfile["role"][]) {
  const { profile, ...rest } = await getCurrentProfile();
  if (!roles.includes(profile.role)) {
    redirect("/dashboard");
  }
  return { profile, ...rest };
}
