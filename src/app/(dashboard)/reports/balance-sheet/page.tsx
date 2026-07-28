import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableFooter, TableRow } from "@/components/ui/table";
import { DateRangeForm } from "@/components/reports/date-range-form";
import { formatCurrency } from "@/lib/accounting/format";
import { today } from "@/lib/accounting/dates";

export default async function BalanceSheetPage({
  searchParams,
}: {
  searchParams: Promise<{ as_of?: string }>;
}) {
  const { as_of = today() } = await searchParams;
  const supabase = await createClient();
  const { data: rows, error } = await supabase.rpc("balance_sheet", { p_as_of: as_of });

  const assets = (rows ?? []).filter((r) => r.nature === "asset");
  const liabilitiesAndEquity = (rows ?? []).filter((r) => r.nature === "liability" || r.nature === "equity");
  const totalAssets = assets.reduce((s, r) => s + r.amount, 0);
  const totalLiabilities = liabilitiesAndEquity.reduce((s, r) => s + r.amount, 0);

  return (
    <Card>
      <CardHeader className="grid gap-4">
        <CardTitle>Balance Sheet</CardTitle>
        <DateRangeForm action="/reports/balance-sheet" asOf={as_of} />
      </CardHeader>
      <CardContent className="grid gap-6 sm:grid-cols-2">
        {error && <p className="text-sm text-destructive sm:col-span-2">{error.message}</p>}
        <div>
          <h3 className="mb-2 text-sm font-semibold text-muted-foreground">Liabilities &amp; Equity</h3>
          <Table>
            <TableBody>
              {liabilitiesAndEquity.map((r) => (
                <TableRow key={r.group_name}>
                  <TableCell>{r.group_name}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatCurrency(r.amount)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell className="font-semibold">Total</TableCell>
                <TableCell className="text-right font-semibold tabular-nums">{formatCurrency(totalLiabilities)}</TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </div>
        <div>
          <h3 className="mb-2 text-sm font-semibold text-muted-foreground">Assets</h3>
          <Table>
            <TableBody>
              {assets.map((r) => (
                <TableRow key={r.group_name}>
                  <TableCell>{r.group_name}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatCurrency(r.amount)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell className="font-semibold">Total</TableCell>
                <TableCell className="text-right font-semibold tabular-nums">{formatCurrency(totalAssets)}</TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </div>
        {Math.abs(totalAssets - totalLiabilities) > 0.5 && (
          <p className="text-sm text-destructive sm:col-span-2">
            Warning: Assets and Liabilities+Equity differ by {formatCurrency(Math.abs(totalAssets - totalLiabilities))}.
            Check for unposted or unbalanced vouchers.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
