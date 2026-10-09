import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { loadStock, StockSearchBar, StockTable } from "@/components/stock/stock-table";
import { StockItemCreateDialog } from "./stock-item-form";

export default async function StockItemsPage({ searchParams }: { searchParams: Promise<{ q?: string; low?: string }> }) {
  await requireRole(["owner", "accountant"]);
  const { q, low } = await searchParams;
  const supabase = await createClient();

  const [items, { data: categories }, { data: units }] = await Promise.all([
    loadStock(q, low === "1"),
    supabase.from("stock_categories").select("*").order("name"),
    supabase.from("units_of_measure").select("*").order("name"),
  ]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Items &amp; Stock</CardTitle>
          <p className="text-sm text-muted-foreground">{items.length} item(s)</p>
        </div>
        <StockItemCreateDialog categories={categories ?? []} units={units ?? []} />
      </CardHeader>
      <CardContent className="grid gap-4">
        <StockSearchBar basePath="/masters/stock-items" q={q} low={low === "1"} />
        <StockTable rows={items} />
      </CardContent>
    </Card>
  );
}
