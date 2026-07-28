import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DateRangeForm } from "@/components/reports/date-range-form";
import { formatCurrency, formatDate } from "@/lib/accounting/format";
import { startOfMonth, today } from "@/lib/accounting/dates";

export default async function DayBookPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const { from = startOfMonth(), to = today() } = await searchParams;
  const supabase = await createClient();
  const { data: rows, error } = await supabase.rpc("day_book", { p_from: from, p_to: to });

  return (
    <Card>
      <CardHeader className="grid gap-4">
        <CardTitle>Day Book</CardTitle>
        <DateRangeForm action="/reports/day-book" from={from} to={to} />
      </CardHeader>
      <CardContent>
        {error && <p className="text-sm text-destructive">{error.message}</p>}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Voucher No.</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Party</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(rows ?? []).map((r) => (
              <TableRow key={r.voucher_id}>
                <TableCell>{formatDate(r.voucher_date)}</TableCell>
                <TableCell className="font-medium">{r.voucher_no}</TableCell>
                <TableCell>{r.voucher_type_name}</TableCell>
                <TableCell className="text-muted-foreground">{r.party_name ?? "—"}</TableCell>
                <TableCell className="text-right tabular-nums">{formatCurrency(r.total_amount)}</TableCell>
                <TableCell>
                  <Badge variant={r.status === "posted" ? "default" : r.status === "cancelled" ? "destructive" : "secondary"} className="capitalize">
                    {r.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
