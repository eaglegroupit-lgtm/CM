import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/accounting/format";
import { today } from "@/lib/accounting/dates";
import type { LedgerBalanceRow, LedgerWithNature } from "@/types/database";
import { LedgerCreateDialog } from "./ledger-form";

/** Accounts the system posts to automatically — not something a shop owner should pick or edit. */
const SYSTEM_GROUPS = ["Sales Accounts", "Purchase Accounts", "Duties & Taxes"];

export default async function AccountsPage() {
  await requireRole(["owner", "accountant"]);
  const supabase = await createClient();

  const [{ data: ledgers }, { data: balances }] = await Promise.all([
    supabase.from("ledger_with_nature").select("*").eq("party_type", "none").order("name"),
    supabase.rpc("ledger_balances", { p_as_of: today() }),
  ]);

  const balanceById = new Map((balances ?? []).map((b) => [b.ledger_id, b]));
  const all = (ledgers ?? []).filter((l) => !SYSTEM_GROUPS.includes(l.group_name));
  const money = all.filter((l) => l.group_name === "Cash-in-Hand" || l.group_name === "Bank Accounts");
  const expenses = all.filter((l) => l.nature === "expense");
  const others = all.filter((l) => !money.includes(l) && !expenses.includes(l));

  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Cash &amp; Bank</CardTitle>
            <p className="text-sm text-muted-foreground">How much money is where, right now.</p>
          </div>
          <LedgerCreateDialog />
        </CardHeader>
        <CardContent>
          <AccountTable rows={money} balances={balanceById} label="Balance now" />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Expense Heads</CardTitle>
          <p className="text-sm text-muted-foreground">Total spent under each head.</p>
        </CardHeader>
        <CardContent>
          <AccountTable rows={expenses} balances={balanceById} label="Spent" />
        </CardContent>
      </Card>
      {others.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Other Accounts</CardTitle>
          </CardHeader>
          <CardContent>
            <AccountTable rows={others} balances={balanceById} label="Balance" />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function AccountTable({
  rows,
  balances,
  label,
}: {
  rows: LedgerWithNature[];
  balances: Map<string, LedgerBalanceRow>;
  label: string;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead className="text-right">{label}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((l) => (
          <TableRow key={l.id}>
            <TableCell className="font-medium">{l.name}</TableCell>
            <TableCell className="text-right tabular-nums">
              {formatCurrency(Math.abs(balances.get(l.id)?.signed_balance ?? 0))}
            </TableCell>
          </TableRow>
        ))}
        {rows.length === 0 && (
          <TableRow>
            <TableCell colSpan={2} className="text-center text-muted-foreground">
              None yet
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
