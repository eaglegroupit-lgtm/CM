import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createClient } from "@/lib/supabase/server";
import { VOUCHER_META } from "@/lib/accounting/voucher-meta";
import { RecentVouchers } from "@/components/vouchers/recent-vouchers";
import { FinancialVoucherForm } from "../financial-voucher-form";

export default async function JournalVoucherPage() {
  const supabase = await createClient();
  const { data: ledgers } = await supabase.from("ledgers").select("*").eq("is_active", true).order("name");

  return (
    <Tabs defaultValue="new">
      <TabsList>
        <TabsTrigger value="new">New Journal Entry</TabsTrigger>
        <TabsTrigger value="recent">Recent Vouchers</TabsTrigger>
      </TabsList>
      <TabsContent value="new">
        <Card>
          <CardHeader>
            <CardTitle>Journal Voucher</CardTitle>
          </CardHeader>
          <CardContent>
            <FinancialVoucherForm meta={VOUCHER_META.JRNL} ledgers={ledgers ?? []} />
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="recent">
        <Card>
          <CardHeader>
            <CardTitle>Recent Journal Vouchers</CardTitle>
          </CardHeader>
          <CardContent>
            <RecentVouchers typeCode="JRNL" />
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
