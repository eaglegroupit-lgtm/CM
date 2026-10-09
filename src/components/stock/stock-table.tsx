import Link from "next/link";
import { Search } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency, formatNumber } from "@/lib/accounting/format";
import type { StockSummaryRow } from "@/types/database";

/** Stock is valued at the item's purchase price — what the shop actually paid for what's on the shelf. */
export function stockValue(r: Pick<StockSummaryRow, "balance_qty" | "purchase_rate">): number {
  return Math.max(r.balance_qty, 0) * r.purchase_rate;
}

export async function loadStock(q?: string, lowOnly?: boolean) {
  const supabase = await createClient();
  let query = supabase.from("stock_summary").select("*").order("category_name").order("name");
  // Strip characters that have meaning inside a PostgREST or() filter
  const term = q?.replace(/[,()%*\\:"]/g, " ").trim();
  if (term) query = query.or(`name.ilike.%${term}%,brand.ilike.%${term}%,size.ilike.%${term}%,category_name.ilike.%${term}%`);
  if (lowOnly) query = query.eq("is_low_stock", true);
  const { data } = await query;
  return data ?? [];
}

export function StockSearchBar({ basePath, q, low }: { basePath: string; q?: string; low?: boolean }) {
  return (
    <form action={basePath} className="flex flex-wrap items-center gap-2">
      <div className="relative w-full sm:w-72">
        <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input name="q" defaultValue={q} placeholder="Search item, brand, size..." className="pl-8" />
      </div>
      {low && <input type="hidden" name="low" value="1" />}
      <Button type="submit" variant="secondary" size="sm">
        Search
      </Button>
      <Button
        variant={low ? "default" : "outline"}
        size="sm"
        render={<Link href={low ? basePath : `${basePath}?low=1${q ? `&q=${encodeURIComponent(q)}` : ""}`}>Low stock only</Link>}
      />
    </form>
  );
}

export function StockTable({ rows }: { rows: StockSummaryRow[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Item</TableHead>
          <TableHead>Category</TableHead>
          <TableHead className="text-right">In Stock</TableHead>
          <TableHead className="text-right">Selling Price</TableHead>
          <TableHead className="text-right">Stock Value</TableHead>
          <TableHead />
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((r) => (
          <TableRow key={r.item_id}>
            <TableCell>
              <div className="font-medium">{r.name}</div>
              <div className="text-xs text-muted-foreground">
                {[r.brand, r.size, r.thickness_mm ? `${r.thickness_mm}mm` : null, `GST ${r.gst_rate}%`]
                  .filter(Boolean)
                  .join(" · ")}
              </div>
            </TableCell>
            <TableCell className="text-muted-foreground">{r.category_name}</TableCell>
            <TableCell className="text-right tabular-nums">
              {formatNumber(r.balance_qty)} {r.unit_name}
            </TableCell>
            <TableCell className="text-right tabular-nums">{formatCurrency(r.standard_rate)}</TableCell>
            <TableCell className="text-right tabular-nums">{formatCurrency(stockValue(r))}</TableCell>
            <TableCell>{r.is_low_stock && <Badge variant="destructive">Low stock</Badge>}</TableCell>
          </TableRow>
        ))}
        {rows.length === 0 && (
          <TableRow>
            <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
              No items found
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
