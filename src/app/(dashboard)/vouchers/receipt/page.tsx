import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getMoneyAccounts } from "@/lib/accounting/system-ledgers";
import { RecentVouchers } from "@/components/vouchers/recent-vouchers";
import { MoneyVoucherForm } from "../money-voucher-form";

export default async function MoneyReceivedPage() {
  await requireRole(["owner", "accountant"]);
  const supabase = await createClient();
  const [{ data: customers }, moneyAccounts] = await Promise.all([
    supabase.from("ledgers").select("*").in("party_type", ["debtor", "both"]).eq("is_active", true).order("name"),
    getMoneyAccounts(),
  ]);

  return (
    <Tabs defaultValue="new">
      <TabsList>
        <TabsTrigger value="new">Money Received</TabsTrigger>
        <TabsTrigger value="recent">Previous Entries</TabsTrigger>
      </TabsList>
      <TabsContent value="new">
        <Card>
          <CardHeader>
            <CardTitle>Money Received from Customer</CardTitle>
            <p className="text-sm text-muted-foreground">
              Record a payment a customer made against their credit bills.
            </p>
          </CardHeader>
          <CardContent>
            <MoneyVoucherForm mode="in" parties={customers ?? []} moneyAccounts={moneyAccounts} />
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="recent">
        <Card>
          <CardHeader>
            <CardTitle>Previous Money Received</CardTitle>
          </CardHeader>
          <CardContent>
            <RecentVouchers typeCode="RCPT" />
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
