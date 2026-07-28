import { getCurrentProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { EntityDialog } from "@/components/masters/entity-dialog";
import { formatCurrency } from "@/lib/accounting/format";
import { LedgerForm } from "./ledger-form";

export default async function LedgersPage() {
  const { profile } = await getCurrentProfile();
  const canWrite = profile.role === "owner" || profile.role === "accountant";
  const supabase = await createClient();

  const [{ data: ledgers }, { data: groups }] = await Promise.all([
    supabase.from("ledger_with_nature").select("*").order("name"),
    supabase.from("account_groups").select("*").order("name"),
  ]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Ledgers</CardTitle>
        {canWrite && (
          <EntityDialog triggerLabel="New Ledger" title="Create Ledger">
            {(close) => <LedgerForm groups={groups ?? []} onDone={close} />}
          </EntityDialog>
        )}
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Group</TableHead>
              <TableHead>Party Type</TableHead>
              <TableHead className="text-right">Opening Balance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(ledgers ?? []).map((l) => (
              <TableRow key={l.id}>
                <TableCell className="font-medium">{l.name}</TableCell>
                <TableCell className="text-muted-foreground">{l.group_name}</TableCell>
                <TableCell>
                  {l.party_type !== "none" && (
                    <Badge variant="outline" className="capitalize">
                      {l.party_type}
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatCurrency(l.opening_balance)} {l.opening_balance_type === "debit" ? "Dr" : "Cr"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
