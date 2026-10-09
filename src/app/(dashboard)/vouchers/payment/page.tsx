import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getMoneyAccounts } from "@/lib/accounting/system-ledgers";
import { RecentVouchers } from "@/components/vouchers/recent-vouchers";
import { MoneyVoucherForm } from "../money-voucher-form";

export default async function MoneyPaidPage() {
  await requireRole(["owner", "accountant"]);
  const supabase = await createClient();
  const [{ data: suppliers }, { data: expenses }, moneyAccounts] = await Promise.all([
    supabase.from("ledgers").select("*").in("party_type", ["creditor", "both"]).eq("is_active", true).order("name"),
    supabase
      .from("ledger_with_nature")
      .select("id, name")
      .eq("nature", "expense")
      .neq("group_name", "Purchase Accounts")
      .eq("is_active", true)
      .order("name"),
    getMoneyAccounts(),
  ]);

  return (
    <Tabs defaultValue="new">
      <TabsList>
        <TabsTrigger value="new">Money Paid</TabsTrigger>
        <TabsTrigger value="recent">Previous Entries</TabsTrigger>
      </TabsList>
      <TabsContent value="new">
        <Card>
          <CardHeader>
            <CardTitle>Money Paid / Expenses</CardTitle>
            <p className="text-sm text-muted-foreground">
              Pay a supplier against their bills, or record a shop expense like rent, salary or transport.
            </p>
          </CardHeader>
          <CardContent>
            <MoneyVoucherForm
              mode="out"
              parties={suppliers ?? []}
              expenseAccounts={expenses ?? []}
              moneyAccounts={moneyAccounts}
            />
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="recent">
        <Card>
          <CardHeader>
            <CardTitle>Previous Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <RecentVouchers typeCode="PMT" />
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
