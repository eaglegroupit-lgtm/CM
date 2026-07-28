import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CompanyForm } from "./company-form";

export default async function CompanySettingsPage() {
  await requireRole(["owner"]);
  const supabase = await createClient();
  const { data: company } = await supabase.from("company_settings").select("*").single();

  if (!company) {
    return <p className="text-sm text-destructive">Company settings not found. Run supabase/seed.sql.</p>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Company Settings</CardTitle>
      </CardHeader>
      <CardContent>
        <CompanyForm company={company} />
      </CardContent>
    </Card>
  );
}
