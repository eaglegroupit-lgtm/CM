import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatTile } from "@/components/dashboard/stat-tile";
import { SalesTrendChart, type SalesTrendPoint } from "@/components/dashboard/sales-trend-chart";
import { StockByCategoryChart, type CategoryValuePoint } from "@/components/dashboard/stock-by-category-chart";
import { AgeingChart, type AgeingBucket } from "@/components/dashboard/ageing-chart";
import { RecentVouchers } from "@/components/vouchers/recent-vouchers";
import { formatCurrency } from "@/lib/accounting/format";
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
    stockByCategory.set(r.category_name, (stockByCategory.get(r.category_name) ?? 0) + r.balance_value);
  }
  const categoryData: CategoryValuePoint[] = Array.from(stockByCategory.entries()).map(([category, value]) => ({
    category,
    value,
  }));

  const totalStockValue = (stockRows ?? []).reduce((s, r) => s + r.balance_value, 0);
  const lowStockCount = (stockRows ?? []).filter((r) => r.is_low_stock).length;
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
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Today's Sales" value={formatCurrency(todaysSales)} />
        {canSeeFinancials && (
          <>
            <StatTile label="Outstanding Receivable" value={formatCurrency(totalReceivable)} />
            <StatTile label="Outstanding Payable" value={formatCurrency(totalPayable)} />
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

      {canSeeFinancials && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Receivables Ageing</CardTitle>
          </CardHeader>
          <CardContent>
            <AgeingChart data={ageingData} />
          </CardContent>
        </Card>
      )}

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
