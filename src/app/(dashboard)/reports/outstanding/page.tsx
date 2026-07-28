import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/accounting/format";
import type { OutstandingRow } from "@/types/database";

function OutstandingTable({ rows }: { rows: OutstandingRow[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Bill No.</TableHead>
          <TableHead>Party</TableHead>
          <TableHead>Bill Date</TableHead>
          <TableHead>Due Date</TableHead>
          <TableHead className="text-right">Outstanding</TableHead>
          <TableHead>Overdue</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((r) => (
          <TableRow key={r.bill_id}>
            <TableCell className="font-medium">{r.bill_no}</TableCell>
            <TableCell>{r.party_name}</TableCell>
            <TableCell>{formatDate(r.bill_date)}</TableCell>
            <TableCell>{r.due_date ? formatDate(r.due_date) : "—"}</TableCell>
            <TableCell className="text-right tabular-nums">{formatCurrency(r.outstanding_amount)}</TableCell>
            <TableCell>
              {r.days_overdue !== null && r.days_overdue > 0 && (
                <Badge variant="destructive">{r.days_overdue} days</Badge>
              )}
            </TableCell>
          </TableRow>
        ))}
        {rows.length === 0 && (
          <TableRow>
            <TableCell colSpan={6} className="text-center text-muted-foreground">
              Nothing outstanding
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}

export default async function OutstandingPage() {
  const supabase = await createClient();
  const [{ data: receivables }, { data: payables }] = await Promise.all([
    supabase.from("outstanding_receivables").select("*").order("due_date"),
    supabase.from("outstanding_payables").select("*").order("due_date"),
  ]);

  const totalReceivable = (receivables ?? []).reduce((s, r) => s + r.outstanding_amount, 0);
  const totalPayable = (payables ?? []).reduce((s, r) => s + r.outstanding_amount, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Outstanding</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="receivables">
          <TabsList>
            <TabsTrigger value="receivables">Receivables ({formatCurrency(totalReceivable)})</TabsTrigger>
            <TabsTrigger value="payables">Payables ({formatCurrency(totalPayable)})</TabsTrigger>
          </TabsList>
          <TabsContent value="receivables">
            <OutstandingTable rows={receivables ?? []} />
          </TabsContent>
          <TabsContent value="payables">
            <OutstandingTable rows={payables ?? []} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
