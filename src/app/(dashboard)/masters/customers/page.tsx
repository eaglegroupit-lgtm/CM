import { getCurrentProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/accounting/format";
import { today } from "@/lib/accounting/dates";
import { CustomerCreateDialog } from "./customer-form";

export default async function CustomersPage() {
  const { profile } = await getCurrentProfile();
  const canWrite = profile.role === "owner" || profile.role === "accountant";
  const supabase = await createClient();

  const [{ data: customers }, { data: balances }] = await Promise.all([
    supabase.from("ledgers").select("*").in("party_type", ["debtor", "both"]).order("name"),
    supabase.rpc("ledger_balances", { p_as_of: today() }),
  ]);

  const balanceByLedger = new Map((balances ?? []).map((b) => [b.ledger_id, b]));

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Customers</CardTitle>
        {canWrite && <CustomerCreateDialog />}
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>State</TableHead>
              <TableHead>GSTIN</TableHead>
              <TableHead className="text-right">Credit Limit</TableHead>
              <TableHead className="text-right">Outstanding</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(customers ?? []).map((c) => {
              const bal = balanceByLedger.get(c.id);
              return (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell className="text-muted-foreground">{c.phone ?? "—"}</TableCell>
                  <TableCell>{c.state ?? "—"}</TableCell>
                  <TableCell>{c.gstin ? c.gstin : <Badge variant="outline">Unregistered</Badge>}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {c.credit_limit ? formatCurrency(c.credit_limit) : "—"}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {bal ? formatCurrency(bal.debit_balance) : formatCurrency(0)}
                  </TableCell>
                </TableRow>
              );
            })}
            {(customers ?? []).length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  No customers yet
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
