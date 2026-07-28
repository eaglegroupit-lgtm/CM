import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createClient } from "@/lib/supabase/server";
import { VOUCHER_META } from "@/lib/accounting/voucher-meta";
import { RecentVouchers } from "@/components/vouchers/recent-vouchers";
import { FinancialVoucherForm } from "../financial-voucher-form";

export default async function PaymentVoucherPage() {
  const supabase = await createClient();
  const { data: ledgers } = await supabase.from("ledgers").select("*").eq("is_active", true).order("name");

  return (
    <Tabs defaultValue="new">
      <TabsList>
        <TabsTrigger value="new">New Payment</TabsTrigger>
        <TabsTrigger value="recent">Recent Vouchers</TabsTrigger>
      </TabsList>
      <TabsContent value="new">
        <Card>
          <CardHeader>
            <CardTitle>Payment Voucher</CardTitle>
          </CardHeader>
          <CardContent>
            <FinancialVoucherForm meta={VOUCHER_META.PMT} ledgers={ledgers ?? []} />
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="recent">
        <Card>
          <CardHeader>
            <CardTitle>Recent Payment Vouchers</CardTitle>
          </CardHeader>
          <CardContent>
            <RecentVouchers typeCode="PMT" />
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
