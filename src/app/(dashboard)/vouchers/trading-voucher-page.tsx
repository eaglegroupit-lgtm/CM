import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { getMoneyAccounts, getSystemLedgerIds } from "@/lib/accounting/system-ledgers";
import { VOUCHER_META } from "@/lib/accounting/voucher-meta";
import { RecentVouchers } from "@/components/vouchers/recent-vouchers";
import { CustomerCreateDialog } from "../masters/customers/customer-form";
import { SupplierCreateDialog } from "../masters/suppliers/supplier-form";
import { TradingVoucherForm } from "./trading-voucher-form";

/** Shared page for the item-based entries: Sale, Purchase, Sales Return and Purchase Return. */
export async function TradingVoucherPage({
  code,
  title,
  description,
}: {
  code: "SALE" | "PURC" | "CNOTE" | "DNOTE";
  title: string;
  description: string;
}) {
  const meta = VOUCHER_META[code];
  const partyRole = code === "SALE" || code === "CNOTE" ? "customer" : "supplier";
  // Counter staff may only bill sales; purchases and returns are for owner/accountant
  const { profile } = await requireRole(code === "SALE" ? ["owner", "accountant", "sales_staff"] : ["owner", "accountant"]);
  const canAddParty = profile.role === "owner" || profile.role === "accountant";
  const supabase = await createClient();

  const [{ data: parties }, { data: stockItems }, { data: balances }, { data: units }, { data: company }, systemLedgers, moneyAccounts] =
    await Promise.all([
      supabase
        .from("ledgers")
        .select("*")
        .in("party_type", partyRole === "customer" ? ["debtor", "both"] : ["creditor", "both"])
        .eq("is_active", true)
        .order("name"),
      supabase.from("stock_items").select("*").eq("is_active", true).order("name"),
      supabase.from("stock_summary").select("item_id, balance_qty"),
      supabase.from("units_of_measure").select("*"),
      supabase.from("company_settings").select("state").single(),
      getSystemLedgerIds(),
      getMoneyAccounts(),
    ]);

  const stockBalances = Object.fromEntries((balances ?? []).map((b) => [b.item_id, b.balance_qty]));

  return (
    <Tabs defaultValue="new">
      <TabsList>
        <TabsTrigger value="new">New {meta.label}</TabsTrigger>
        <TabsTrigger value="recent">Previous Entries</TabsTrigger>
      </TabsList>
      <TabsContent value="new">
        <Card>
          <CardHeader>
            <CardTitle>{title}</CardTitle>
            <p className="text-sm text-muted-foreground">{description}</p>
          </CardHeader>
          <CardContent>
            <TradingVoucherForm
              meta={meta}
              partyRole={partyRole}
              parties={parties ?? []}
              stockItems={stockItems ?? []}
              stockBalances={stockBalances}
              units={units ?? []}
              moneyAccounts={moneyAccounts}
              companyState={company?.state ?? "Tamil Nadu"}
              systemLedgers={systemLedgers}
              addPartyButton={
                canAddParty ? partyRole === "customer" ? <CustomerCreateDialog /> : <SupplierCreateDialog /> : undefined
              }
            />
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="recent">
        <Card>
          <CardHeader>
            <CardTitle>Previous {meta.label} Entries</CardTitle>
          </CardHeader>
          <CardContent>
            <RecentVouchers typeCode={code} />
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
