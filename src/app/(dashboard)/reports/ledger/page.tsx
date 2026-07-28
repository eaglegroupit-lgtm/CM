import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/accounting/format";
import { financialYearStart, today } from "@/lib/accounting/dates";

export default async function LedgerReportPage({
  searchParams,
}: {
  searchParams: Promise<{ ledger_id?: string; from?: string; to?: string }>;
}) {
  const { ledger_id = "", from = financialYearStart(), to = today() } = await searchParams;
  const supabase = await createClient();
  const { data: ledgers } = await supabase.from("ledgers").select("id, name").order("name");

  const { data: rows, error } = ledger_id
    ? await supabase.rpc("ledger_statement", { p_ledger_id: ledger_id, p_from: from, p_to: to })
    : { data: null, error: null };

  return (
    <Card>
      <CardHeader className="grid gap-4">
        <CardTitle>Ledger Account</CardTitle>
        <form action="/reports/ledger" method="get" className="flex flex-wrap items-end gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="ledger_id">Ledger</Label>
            <select
              id="ledger_id"
              name="ledger_id"
              defaultValue={ledger_id}
              className="h-9 rounded-md border bg-transparent px-3 text-sm"
            >
              <option value="">Select a ledger</option>
              {(ledgers ?? []).map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="from">From</Label>
            <Input id="from" type="date" name="from" defaultValue={from} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="to">To</Label>
            <Input id="to" type="date" name="to" defaultValue={to} />
          </div>
          <Button type="submit">Apply</Button>
        </form>
      </CardHeader>
      <CardContent>
        {error && <p className="text-sm text-destructive">{error.message}</p>}
        {ledger_id ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Voucher No.</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Debit</TableHead>
                <TableHead className="text-right">Credit</TableHead>
                <TableHead className="text-right">Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(rows ?? []).map((r) => (
                <TableRow key={r.voucher_id}>
                  <TableCell>{formatDate(r.voucher_date)}</TableCell>
                  <TableCell className="font-medium">{r.voucher_no}</TableCell>
                  <TableCell>{r.voucher_type_name}</TableCell>
                  <TableCell className="text-right tabular-nums">{r.debit_amount > 0 ? formatCurrency(r.debit_amount) : ""}</TableCell>
                  <TableCell className="text-right tabular-nums">{r.credit_amount > 0 ? formatCurrency(r.credit_amount) : ""}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatCurrency(Math.abs(r.running_balance))} {r.running_balance >= 0 ? "Dr" : "Cr"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-sm text-muted-foreground">Select a ledger to view its statement.</p>
        )}
      </CardContent>
    </Card>
  );
}
