import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableFooter, TableRow } from "@/components/ui/table";
import { DateRangeForm } from "@/components/reports/date-range-form";
import { formatCurrency } from "@/lib/accounting/format";
import { financialYearStart, today } from "@/lib/accounting/dates";

export default async function ProfitAndLossPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const { from = financialYearStart(), to = today() } = await searchParams;
  const supabase = await createClient();
  const { data: rows, error } = await supabase.rpc("profit_and_loss", { p_from: from, p_to: to });

  const income = (rows ?? []).filter((r) => r.nature === "income");
  const expense = (rows ?? []).filter((r) => r.nature === "expense");
  const totalIncome = income.reduce((s, r) => s + r.amount, 0);
  const totalExpense = expense.reduce((s, r) => s + r.amount, 0);
  const netProfit = totalIncome - totalExpense;

  return (
    <Card>
      <CardHeader className="grid gap-4">
        <CardTitle>Profit &amp; Loss</CardTitle>
        <DateRangeForm action="/reports/profit-and-loss" from={from} to={to} />
      </CardHeader>
      <CardContent className="grid gap-6 sm:grid-cols-2">
        {error && <p className="text-sm text-destructive sm:col-span-2">{error.message}</p>}
        <div>
          <h3 className="mb-2 text-sm font-semibold text-muted-foreground">Expenses</h3>
          <Table>
            <TableBody>
              {expense.map((r) => (
                <TableRow key={r.group_name}>
                  <TableCell>{r.group_name}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatCurrency(r.amount)}</TableCell>
                </TableRow>
              ))}
              {netProfit > 0 && (
                <TableRow>
                  <TableCell className="font-semibold">Net Profit</TableCell>
                  <TableCell className="text-right font-semibold tabular-nums">{formatCurrency(netProfit)}</TableCell>
                </TableRow>
              )}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell className="font-semibold">Total</TableCell>
                <TableCell className="text-right font-semibold tabular-nums">
                  {formatCurrency(totalExpense + Math.max(netProfit, 0))}
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </div>
        <div>
          <h3 className="mb-2 text-sm font-semibold text-muted-foreground">Income</h3>
          <Table>
            <TableBody>
              {income.map((r) => (
                <TableRow key={r.group_name}>
                  <TableCell>{r.group_name}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatCurrency(r.amount)}</TableCell>
                </TableRow>
              ))}
              {netProfit < 0 && (
                <TableRow>
                  <TableCell className="font-semibold">Net Loss</TableCell>
                  <TableCell className="text-right font-semibold tabular-nums">{formatCurrency(-netProfit)}</TableCell>
                </TableRow>
              )}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell className="font-semibold">Total</TableCell>
                <TableCell className="text-right font-semibold tabular-nums">
                  {formatCurrency(totalIncome + Math.max(-netProfit, 0))}
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
