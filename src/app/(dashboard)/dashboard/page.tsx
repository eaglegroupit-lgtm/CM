import Link from "next/link";
import { HandCoins, ReceiptText, ShoppingCart, Wallet, type LucideIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatTile } from "@/components/dashboard/stat-tile";
import { SalesTrendChart, type SalesTrendPoint } from "@/components/dashboard/sales-trend-chart";
import { StockByCategoryChart, type CategoryValuePoint } from "@/components/dashboard/stock-by-category-chart";
import { AgeingChart, type AgeingBucket } from "@/components/dashboard/ageing-chart";
import { RecentVouchers } from "@/components/vouchers/recent-vouchers";
import { Badge } from "@/components/ui/badge";
import { stockValue } from "@/components/stock/stock-table";
import { formatCurrency, formatNumber } from "@/lib/accounting/format";
import { today } from "@/lib/accounting/dates";

export default async function DashboardPage() {
  const { profile } = await getCurrentProfile();
  const canSeeFinancials = profile.role === "owner" || profile.role === "accountant";
  const supabase = await createClient();

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
  const fromDate = thirtyDaysAgo.toISOString().slice(0, 10);

  const { data: saleType } = await supabase.from("voucher_types").select("id").eq("code", "SALE").single();

  const [{ data: salesVouchers }, { data: stockRows }, receivablesResult, payablesResult] = await Promise.all([
    saleType
      ? supabase
          .from("vouchers")
          .select("voucher_date, total_amount")
          .eq("voucher_type_id", saleType.id)
          .eq("status", "posted")
          .gte("voucher_date", fromDate)
      : Promise.resolve({ data: [] }),
    supabase.from("stock_summary").select("*"),
    canSeeFinancials ? supabase.from("outstanding_receivables").select("*") : Promise.resolve({ data: [] }),
    canSeeFinancials ? supabase.from("outstanding_payables").select("*") : Promise.resolve({ data: [] }),
  ]);

  const receivables = receivablesResult.data ?? [];
  const payables = payablesResult.data ?? [];

  const todayStr = today();
  const todaysSales = (salesVouchers ?? [])
    .filter((v) => v.voucher_date === todayStr)
    .reduce((s, v) => s + v.total_amount, 0);

  const salesByDate = new Map<string, number>();
  for (const v of salesVouchers ?? []) {
    salesByDate.set(v.voucher_date, (salesByDate.get(v.voucher_date) ?? 0) + v.total_amount);
  }
  const trend: SalesTrendPoint[] = [];
  for (let i = 0; i < 30; i++) {
    const d = new Date(thirtyDaysAgo);
    d.setDate(d.getDate() + i);
    const iso = d.toISOString().slice(0, 10);
    trend.push({
      date: iso,
      label: d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
      amount: salesByDate.get(iso) ?? 0,
    });
  }

  const stockByCategory = new Map<string, number>();
  for (const r of stockRows ?? []) {
    stockByCategory.set(r.category_name, (stockByCategory.get(r.category_name) ?? 0) + stockValue(r));
  }
  const categoryData: CategoryValuePoint[] = Array.from(stockByCategory.entries()).map(([category, value]) => ({
    category,
    value,
  }));

  const totalStockValue = (stockRows ?? []).reduce((s, r) => s + stockValue(r), 0);
  const lowStockItems = (stockRows ?? []).filter((r) => r.is_low_stock);
  const lowStockCount = lowStockItems.length;
  const totalReceivable = receivables.reduce((s, r) => s + r.outstanding_amount, 0);
  const totalPayable = payables.reduce((s, r) => s + r.outstanding_amount, 0);

  const buckets = [
    { bucket: "Not yet due", min: -Infinity, max: 0 },
    { bucket: "0-30 days", min: 1, max: 30 },
    { bucket: "31-60 days", min: 31, max: 60 },
    { bucket: "61-90 days", min: 61, max: 90 },
    { bucket: "90+ days", min: 91, max: Infinity },
  ];
  const ageingData: AgeingBucket[] = buckets.map(({ bucket, min, max }) => ({
    bucket,
    amount: receivables
      .filter((r) => (r.days_overdue ?? 0) >= min && (r.days_overdue ?? 0) <= max)
      .reduce((s, r) => s + r.outstanding_amount, 0),
  }));

  return (
    <div className="grid gap-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <QuickAction href="/vouchers/sales" icon={ReceiptText} label="New Sale" hint="Make a bill" primary />
        {canSeeFinancials && (
          <>
            <QuickAction href="/vouchers/purchase" icon={ShoppingCart} label="Purchase" hint="Stock came in" />
            <QuickAction href="/vouchers/receipt" icon={HandCoins} label="Money Received" hint="Customer paid" />
            <QuickAction href="/vouchers/payment" icon={Wallet} label="Money Paid" hint="Supplier / expense" />
          </>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Today's Sales" value={formatCurrency(todaysSales)} />
        {canSeeFinancials && (
          <>
            <StatTile label="To Collect (customers owe)" value={formatCurrency(totalReceivable)} />
            <StatTile label="To Pay (suppliers)" value={formatCurrency(totalPayable)} />
          </>
        )}
        <StatTile
          label="Stock Value"
          value={formatCurrency(totalStockValue)}
          hint={lowStockCount > 0 ? `${lowStockCount} item(s) low on stock` : undefined}
          tone={lowStockCount > 0 ? "critical" : "default"}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sales — Last 30 Days</CardTitle>
          </CardHeader>
          <CardContent>
            <SalesTrendChart data={trend} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Stock Value by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <StockByCategoryChart data={categoryData} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Low Stock — Reorder Soon</CardTitle>
            {lowStockCount > 0 && <Badge variant="destructive">{lowStockCount}</Badge>}
          </CardHeader>
          <CardContent>
            {lowStockItems.length === 0 ? (
              <p className="text-sm text-muted-foreground">All items are above their low-stock level.</p>
            ) : (
              <ul className="grid gap-1.5 text-sm">
                {lowStockItems.slice(0, 8).map((r) => (
                  <li key={r.item_id} className="flex justify-between gap-2">
                    <span className="truncate">{r.name}</span>
                    <span className="tabular-nums text-destructive">
                      {formatNumber(r.balance_qty)} {r.unit_name}
                    </span>
                  </li>
                ))}
                {lowStockItems.length > 8 && (
                  <li>
                    <Link href="/reports/stock-summary?low=1" className="text-primary hover:underline">
                      See all {lowStockItems.length} items
                    </Link>
                  </li>
                )}
              </ul>
            )}
          </CardContent>
        </Card>
        {canSeeFinancials && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Money to Collect — How Old</CardTitle>
            </CardHeader>
            <CardContent>
              <AgeingChart data={ageingData} />
            </CardContent>
          </Card>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Sales</CardTitle>
        </CardHeader>
        <CardContent>
          <RecentVouchers typeCode="SALE" />
        </CardContent>
      </Card>
    </div>
  );
}

function QuickAction({
  href,
  icon: Icon,
  label,
  hint,
  primary,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
  hint: string;
  primary?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 rounded-xl border p-4 transition-colors ${
        primary ? "bg-primary text-primary-foreground hover:bg-primary/90" : "bg-card hover:bg-accent"
      }`}
    >
      <Icon className="size-6 shrink-0" />
      <div className="grid">
        <span className="font-semibold">{label}</span>
        <span className={`text-xs ${primary ? "text-primary-foreground/80" : "text-muted-foreground"}`}>{hint}</span>
      </div>
    </Link>
  );
}
