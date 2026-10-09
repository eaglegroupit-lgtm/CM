import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/accounting/format";
import { loadStock, StockSearchBar, StockTable, stockValue } from "@/components/stock/stock-table";

export default async function StockReportPage({ searchParams }: { searchParams: Promise<{ q?: string; low?: string }> }) {
  const { q, low } = await searchParams;
  const rows = await loadStock(q, low === "1");
  const totalValue = rows.reduce((s, r) => s + stockValue(r), 0);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Stock Report</CardTitle>
        <p className="text-sm text-muted-foreground">Total stock value (at purchase price): {formatCurrency(totalValue)}</p>
      </CardHeader>
      <CardContent className="grid gap-4">
        <StockSearchBar basePath="/reports/stock-summary" q={q} low={low === "1"} />
        <StockTable rows={rows} />
      </CardContent>
    </Card>
  );
}
