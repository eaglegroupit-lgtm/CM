import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatNumber } from "@/lib/accounting/format";
import { StockItemCreateDialog } from "./stock-item-form";

export default async function StockItemsPage() {
  await requireRole(["owner", "accountant"]);
  const supabase = await createClient();

  const [{ data: items }, { data: categories }, { data: units }] = await Promise.all([
    supabase.from("stock_summary").select("*").order("name"),
    supabase.from("stock_categories").select("*").order("name"),
    supabase.from("units_of_measure").select("*").order("name"),
  ]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Stock Items</CardTitle>
        <StockItemCreateDialog categories={categories ?? []} units={units ?? []} />
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Balance Qty</TableHead>
              <TableHead className="text-right">Balance Value</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(items ?? []).map((it) => (
              <TableRow key={it.item_id}>
                <TableCell className="font-medium">{it.name}</TableCell>
                <TableCell className="text-muted-foreground">{it.category_name}</TableCell>
                <TableCell className="capitalize">{it.item_type}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatNumber(it.balance_qty)} {it.unit_name}
                </TableCell>
                <TableCell className="text-right tabular-nums">{formatCurrency(it.balance_value)}</TableCell>
                <TableCell>
                  {it.is_low_stock && <Badge variant="destructive">Low stock</Badge>}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
