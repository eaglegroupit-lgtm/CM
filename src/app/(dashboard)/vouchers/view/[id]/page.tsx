import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/accounting/format";
import { FileDown } from "lucide-react";

export default async function VoucherViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: voucher } = await supabase
    .from("vouchers")
    .select("*, voucher_types(code, name), ledgers(name)")
    .eq("id", id)
    .single();

  if (!voucher) notFound();

  const [{ data: ledgerLines }, { data: invLines }, { data: taxLines }] = await Promise.all([
    supabase.from("voucher_ledger_entries").select("*, ledgers(name)").eq("voucher_id", id),
    supabase.from("voucher_inventory_entries").select("*, stock_items(name), godowns(name)").eq("voucher_id", id),
    supabase.from("voucher_tax_details").select("*").eq("voucher_id", id),
  ]);

  const voucherTypeCode = (voucher as unknown as { voucher_types: { code: string; name: string } }).voucher_types.code;
  const partyName = (voucher as unknown as { ledgers: { name: string } | null }).ledgers?.name;

  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>
              {(voucher as unknown as { voucher_types: { name: string } }).voucher_types.name} — {voucher.voucher_no}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {formatDate(voucher.voucher_date)} {partyName ? `• ${partyName}` : ""}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={voucher.status === "posted" ? "default" : voucher.status === "cancelled" ? "destructive" : "secondary"} className="capitalize">
              {voucher.status}
            </Badge>
            {voucherTypeCode === "SALE" && (
              <Button
                size="sm"
                variant="outline"
                render={
                  <Link href={`/api/invoices/${voucher.id}/pdf`} target="_blank">
                    <FileDown className="size-4" />
                    GST Invoice PDF
                  </Link>
                }
              />
            )}
          </div>
        </CardHeader>
        <CardContent className="grid gap-1 text-sm">
          {voucher.reference_no && <p><span className="text-muted-foreground">Reference:</span> {voucher.reference_no}</p>}
          {voucher.narration && <p><span className="text-muted-foreground">Narration:</span> {voucher.narration}</p>}
          <p className="text-lg font-semibold">Total: {formatCurrency(voucher.total_amount)}</p>
        </CardContent>
      </Card>

      {invLines && invLines.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Items</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Godown</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Rate</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(invLines as unknown as { id: string; stock_items: { name: string }; godowns: { name: string }; quantity: number; rate: number; amount: number }[]).map((l) => (
                  <TableRow key={l.id}>
                    <TableCell>{l.stock_items.name}</TableCell>
                    <TableCell className="text-muted-foreground">{l.godowns.name}</TableCell>
                    <TableCell className="text-right tabular-nums">{l.quantity}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatCurrency(l.rate)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatCurrency(l.amount)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ledger Entries</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ledger</TableHead>
                <TableHead className="text-right">Debit</TableHead>
                <TableHead className="text-right">Credit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(ledgerLines as unknown as { id: string; ledgers: { name: string }; debit_amount: number; credit_amount: number }[] ?? []).map((l) => (
                <TableRow key={l.id}>
                  <TableCell>{l.ledgers.name}</TableCell>
                  <TableCell className="text-right tabular-nums">{l.debit_amount > 0 ? formatCurrency(l.debit_amount) : ""}</TableCell>
                  <TableCell className="text-right tabular-nums">{l.credit_amount > 0 ? formatCurrency(l.credit_amount) : ""}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {taxLines && taxLines.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tax Details</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Taxable Value</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {taxLines.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell>{t.tax_type}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatCurrency(t.taxable_value)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatCurrency(t.amount)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
