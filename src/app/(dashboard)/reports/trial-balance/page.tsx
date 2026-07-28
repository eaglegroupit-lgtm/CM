import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DateRangeForm } from "@/components/reports/date-range-form";
import { formatCurrency } from "@/lib/accounting/format";
import { today } from "@/lib/accounting/dates";

export default async function TrialBalancePage({
  searchParams,
}: {
  searchParams: Promise<{ as_of?: string }>;
}) {
  const { as_of = today() } = await searchParams;
  const supabase = await createClient();
  const { data: rows, error } = await supabase.rpc("trial_balance", { p_as_of: as_of });

  const totalDebit = (rows ?? []).reduce((s, r) => s + r.debit_balance, 0);
  const totalCredit = (rows ?? []).reduce((s, r) => s + r.credit_balance, 0);

  return (
    <Card>
      <CardHeader className="grid gap-4">
        <CardTitle>Trial Balance</CardTitle>
        <DateRangeForm action="/reports/trial-balance" asOf={as_of} />
      </CardHeader>
      <CardContent>
        {error && <p className="text-sm text-destructive">{error.message}</p>}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ledger</TableHead>
              <TableHead>Group</TableHead>
              <TableHead className="text-right">Debit</TableHead>
              <TableHead className="text-right">Credit</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(rows ?? []).map((r) => (
              <TableRow key={r.ledger_id}>
                <TableCell className="font-medium">{r.name}</TableCell>
                <TableCell className="text-muted-foreground">{r.group_name}</TableCell>
                <TableCell className="text-right tabular-nums">{r.debit_balance > 0 ? formatCurrency(r.debit_balance) : ""}</TableCell>
                <TableCell className="text-right tabular-nums">{r.credit_balance > 0 ? formatCurrency(r.credit_balance) : ""}</TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={2} className="font-semibold">
                Total
              </TableCell>
              <TableCell className="text-right font-semibold tabular-nums">{formatCurrency(totalDebit)}</TableCell>
              <TableCell className="text-right font-semibold tabular-nums">{formatCurrency(totalCredit)}</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </CardContent>
    </Card>
  );
}
