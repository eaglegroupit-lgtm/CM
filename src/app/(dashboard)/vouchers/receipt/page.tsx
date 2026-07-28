import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createClient } from "@/lib/supabase/server";
import { VOUCHER_META } from "@/lib/accounting/voucher-meta";
import { RecentVouchers } from "@/components/vouchers/recent-vouchers";
import { FinancialVoucherForm } from "../financial-voucher-form";

export default async function ReceiptVoucherPage() {
  const supabase = await createClient();
  const { data: ledgers } = await supabase.from("ledgers").select("*").eq("is_active", true).order("name");

  return (
    <Tabs defaultValue="new">
      <TabsList>
        <TabsTrigger value="new">New Receipt</TabsTrigger>
        <TabsTrigger value="recent">Recent Vouchers</TabsTrigger>
      </TabsList>
      <TabsContent value="new">
        <Card>
          <CardHeader>
            <CardTitle>Receipt Voucher</CardTitle>
          </CardHeader>
          <CardContent>
            <FinancialVoucherForm meta={VOUCHER_META.RCPT} ledgers={ledgers ?? []} />
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="recent">
        <Card>
          <CardHeader>
            <CardTitle>Recent Receipt Vouchers</CardTitle>
          </CardHeader>
          <CardContent>
            <RecentVouchers typeCode="RCPT" />
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
