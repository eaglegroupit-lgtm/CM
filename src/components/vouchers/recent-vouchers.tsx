import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/accounting/format";

export async function RecentVouchers({ typeCode }: { typeCode: string }) {
  const supabase = await createClient();
  const { data: vouchers } = await supabase
    .from("vouchers")
    .select("id, voucher_no, voucher_date, total_amount, status, party_ledger_id, voucher_type_id, voucher_types!inner(code), ledgers(name)")
    .eq("voucher_types.code", typeCode)
    .order("voucher_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(15);

  const rows = (vouchers ?? []) as unknown as {
    id: string;
    voucher_no: string;
    voucher_date: string;
    total_amount: number;
    status: string;
    ledgers: { name: string } | null;
  }[];

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Voucher No.</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Party</TableHead>
          <TableHead className="text-right">Amount</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((v) => (
          <TableRow key={v.id}>
            <TableCell className="font-medium">
              <Link href={`/vouchers/view/${v.id}`} className="hover:underline">
                {v.voucher_no}
              </Link>
            </TableCell>
            <TableCell>{formatDate(v.voucher_date)}</TableCell>
            <TableCell className="text-muted-foreground">{v.ledgers?.name ?? "—"}</TableCell>
            <TableCell className="text-right tabular-nums">{formatCurrency(v.total_amount)}</TableCell>
            <TableCell>
              <Badge variant={v.status === "posted" ? "default" : v.status === "cancelled" ? "destructive" : "secondary"} className="capitalize">
                {v.status}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
        {rows.length === 0 && (
          <TableRow>
            <TableCell colSpan={5} className="text-center text-muted-foreground">
              No vouchers yet
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
