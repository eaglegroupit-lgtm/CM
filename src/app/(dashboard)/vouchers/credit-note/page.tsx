import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createClient } from "@/lib/supabase/server";
import { getSystemLedgerIds } from "@/lib/accounting/system-ledgers";
import { VOUCHER_META } from "@/lib/accounting/voucher-meta";
import { RecentVouchers } from "@/components/vouchers/recent-vouchers";
import { TradingVoucherForm } from "../trading-voucher-form";

export default async function CreditNotePage() {
  const supabase = await createClient();
  const [{ data: parties }, { data: stockItems }, { data: units }, { data: godowns }, { data: company }, systemLedgers] =
    await Promise.all([
      supabase.from("ledgers").select("*").in("party_type", ["debtor", "both"]).eq("is_active", true).order("name"),
      supabase.from("stock_items").select("*").eq("is_active", true).order("name"),
      supabase.from("units_of_measure").select("*"),
      supabase.from("godowns").select("*"),
      supabase.from("company_settings").select("state").single(),
      getSystemLedgerIds(),
    ]);

  return (
    <Tabs defaultValue="new">
      <TabsList>
        <TabsTrigger value="new">New Credit Note</TabsTrigger>
        <TabsTrigger value="recent">Recent Vouchers</TabsTrigger>
      </TabsList>
      <TabsContent value="new">
        <Card>
          <CardHeader>
            <CardTitle>Credit Note (Sales Return)</CardTitle>
          </CardHeader>
          <CardContent>
            <TradingVoucherForm
              meta={VOUCHER_META.CNOTE}
              partyRole="customer"
              parties={parties ?? []}
              stockItems={stockItems ?? []}
              units={units ?? []}
              godowns={godowns ?? []}
              companyState={company?.state ?? "Tamil Nadu"}
              systemLedgers={systemLedgers}
            />
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="recent">
        <Card>
          <CardHeader>
            <CardTitle>Recent Credit Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <RecentVouchers typeCode="CNOTE" />
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
