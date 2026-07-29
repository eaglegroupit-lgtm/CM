import { getCurrentProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/accounting/format";
import { today } from "@/lib/accounting/dates";
import { SupplierCreateDialog } from "./supplier-form";

export default async function SuppliersPage() {
  const { profile } = await getCurrentProfile();
  const canWrite = profile.role === "owner" || profile.role === "accountant";
  const supabase = await createClient();

  const [{ data: suppliers }, { data: balances }] = await Promise.all([
    supabase.from("ledgers").select("*").in("party_type", ["creditor", "both"]).order("name"),
    supabase.rpc("ledger_balances", { p_as_of: today() }),
  ]);

  const balanceByLedger = new Map((balances ?? []).map((b) => [b.ledger_id, b]));

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Suppliers</CardTitle>
        {canWrite && <SupplierCreateDialog />}
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
            {(suppliers ?? []).map((s) => {
              const bal = balanceByLedger.get(s.id);
              return (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell className="text-muted-foreground">{s.phone ?? "—"}</TableCell>
                  <TableCell>{s.state ?? "—"}</TableCell>
                  <TableCell>{s.gstin ? s.gstin : <Badge variant="outline">Unregistered</Badge>}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {s.credit_limit ? formatCurrency(s.credit_limit) : "—"}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {bal ? formatCurrency(bal.credit_balance) : formatCurrency(0)}
                  </TableCell>
                </TableRow>
              );
            })}
            {(suppliers ?? []).length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  No suppliers yet
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
