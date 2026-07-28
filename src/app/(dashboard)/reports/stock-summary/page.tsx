import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatNumber } from "@/lib/accounting/format";

export default async function StockSummaryPage() {
  const supabase = await createClient();
  const { data: rows } = await supabase.from("stock_summary").select("*").order("category_name").order("name");

  const totalValue = (rows ?? []).reduce((s, r) => s + r.balance_value, 0);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Stock Summary</CardTitle>
        <p className="text-sm text-muted-foreground">Total stock value: {formatCurrency(totalValue)}</p>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Balance Qty</TableHead>
              <TableHead className="text-right">Balance Value</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(rows ?? []).map((r) => (
              <TableRow key={r.item_id}>
                <TableCell className="font-medium">{r.name}</TableCell>
                <TableCell className="text-muted-foreground">{r.category_name}</TableCell>
                <TableCell className="capitalize">{r.item_type}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatNumber(r.balance_qty)} {r.unit_name}
                </TableCell>
                <TableCell className="text-right tabular-nums">{formatCurrency(r.balance_value)}</TableCell>
                <TableCell>{r.is_low_stock && <Badge variant="destructive">Low stock</Badge>}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
