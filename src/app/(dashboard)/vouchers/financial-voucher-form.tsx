"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Ledger } from "@/types/database";
import type { VoucherMeta } from "@/lib/accounting/voucher-meta";
import { formatCurrency } from "@/lib/accounting/format";
import type { CreateVoucherPayload, LedgerEntryInput } from "@/lib/accounting/voucher-payload";
import { isBalanced, sumCredits, sumDebits } from "@/lib/accounting/voucher-payload";
import { postVoucher, getOutstandingBillsForLedger } from "./actions";

interface Row {
  key: string;
  ledger_id: string;
  side: "debit" | "credit";
  amount: string;
  narration: string;
}

function emptyRow(): Row {
  return { key: crypto.randomUUID(), ledger_id: "", side: "debit", amount: "", narration: "" };
}

export function FinancialVoucherForm({ meta, ledgers }: { meta: VoucherMeta; ledgers: Ledger[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [voucherDate, setVoucherDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [referenceNo, setReferenceNo] = useState("");
  const [narration, setNarration] = useState("");
  const [rows, setRows] = useState<Row[]>([emptyRow(), emptyRow()]);

  const [partyId, setPartyId] = useState("");
  const [outstandingBills, setOutstandingBills] = useState<{ bill_id: string; bill_no: string; outstanding_amount: number }[]>([]);
  const [allocations, setAllocations] = useState<Record<string, string>>({});

  useEffect(() => {
    // Legitimate data fetch keyed off the selected party; the else branch just clears
    // stale results from the previous party rather than reacting to new data.
    if (meta.billDirection && partyId) {
      getOutstandingBillsForLedger(partyId, meta.billDirection).then((bills) =>
        setOutstandingBills(bills.map((b) => ({ bill_id: b.bill_id, bill_no: b.bill_no, outstanding_amount: b.outstanding_amount })))
      );
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- clearing stale results, not reacting to new data
      setOutstandingBills([]);
    }
    setAllocations({});
  }, [meta.billDirection, partyId]);

  const entries: LedgerEntryInput[] = rows
    .filter((r) => r.ledger_id && parseFloat(r.amount) > 0)
    .map((r) => ({
      ledger_id: r.ledger_id,
      debit_amount: r.side === "debit" ? parseFloat(r.amount) : 0,
      credit_amount: r.side === "credit" ? parseFloat(r.amount) : 0,
      narration: r.narration || undefined,
    }));

  const totalDebit = sumDebits(entries);
  const totalCredit = sumCredits(entries);
  const balanced = entries.length > 0 && isBalanced(entries);

  function updateRow(key: string, patch: Partial<Row>) {
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }

  function addRow() {
    setRows((rs) => [...rs, emptyRow()]);
  }

  function removeRow(key: string) {
    setRows((rs) => (rs.length > 2 ? rs.filter((r) => r.key !== key) : rs));
  }

  function submit(status: "draft" | "posted") {
    if (entries.length < 2) {
      toast.error("Add at least two ledger lines");
      return;
    }
    if (!isBalanced(entries)) {
      toast.error("Debit and credit totals must match before posting");
      return;
    }

    const bill_allocations = Object.entries(allocations)
      .filter(([, amt]) => parseFloat(amt) > 0)
      .map(([bill_id, amt]) => ({ bill_id, amount: parseFloat(amt) }));

    const payload: CreateVoucherPayload = {
      voucher_type_code: meta.code,
      voucher_date: voucherDate,
      party_ledger_id: partyId || undefined,
      reference_no: referenceNo || undefined,
      narration: narration || undefined,
      status,
      ledger_entries: entries,
      bill_allocations: bill_allocations.length > 0 ? bill_allocations : undefined,
    };

    startTransition(async () => {
      try {
        await postVoucher(payload, `/vouchers/${meta.code.toLowerCase()}`);
        toast.success(`${meta.label} voucher ${status === "posted" ? "posted" : "saved as draft"}`);
        router.refresh();
        setRows([emptyRow(), emptyRow()]);
        setPartyId("");
        setReferenceNo("");
        setNarration("");
        setAllocations({});
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to save voucher");
      }
    });
  }

  return (
    <div className="grid gap-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="grid gap-1.5">
          <Label>Date</Label>
          <Input type="date" value={voucherDate} onChange={(e) => setVoucherDate(e.target.value)} />
        </div>
        <div className="grid gap-1.5">
          <Label>Reference No.</Label>
          <Input value={referenceNo} onChange={(e) => setReferenceNo(e.target.value)} placeholder="Optional" />
        </div>
        {meta.billDirection && (
          <div className="grid gap-1.5">
            <Label>Party (for bill settlement)</Label>
            <Select value={partyId} onValueChange={(v) => setPartyId(v ?? "")}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Optional" />
              </SelectTrigger>
              <SelectContent>
                {ledgers.map((l) => (
                  <SelectItem key={l.id} value={l.id}>
                    {l.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-56">Ledger</TableHead>
              <TableHead className="w-28">Dr / Cr</TableHead>
              <TableHead className="w-36">Amount</TableHead>
              <TableHead>Narration</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.key}>
                <TableCell>
                  <Select value={row.ledger_id} onValueChange={(v) => updateRow(row.key, { ledger_id: v ?? "" })}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select ledger" />
                    </SelectTrigger>
                    <SelectContent>
                      {ledgers.map((l) => (
                        <SelectItem key={l.id} value={l.id}>
                          {l.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Select value={row.side} onValueChange={(v) => updateRow(row.key, { side: (v ?? "debit") as "debit" | "credit" })}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="debit">Debit</SelectItem>
                      <SelectItem value="credit">Credit</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    step="0.01"
                    value={row.amount}
                    onChange={(e) => updateRow(row.key, { amount: e.target.value })}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    value={row.narration}
                    onChange={(e) => updateRow(row.key, { narration: e.target.value })}
                    placeholder="Optional"
                  />
                </TableCell>
                <TableCell>
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeRow(row.key)}>
                    <Trash2 className="size-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="p-2">
          <Button type="button" variant="outline" size="sm" onClick={addRow}>
            <Plus className="size-4" />
            Add Row
          </Button>
        </div>
      </div>

      {outstandingBills.length > 0 && (
        <div className="rounded-md border p-3">
          <p className="mb-2 text-sm font-medium">Allocate against outstanding bills</p>
          <div className="grid gap-2">
            {outstandingBills.map((b) => (
              <div key={b.bill_id} className="flex items-center justify-between gap-2 text-sm">
                <span>
                  {b.bill_no} <span className="text-muted-foreground">({formatCurrency(b.outstanding_amount)} due)</span>
                </span>
                <Input
                  type="number"
                  step="0.01"
                  className="w-32"
                  placeholder="0.00"
                  value={allocations[b.bill_id] ?? ""}
                  onChange={(e) => setAllocations((a) => ({ ...a, [b.bill_id]: e.target.value }))}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-1.5">
        <Label>Narration</Label>
        <Textarea value={narration} onChange={(e) => setNarration(e.target.value)} rows={2} />
      </div>

      <div className="ml-auto grid w-full max-w-xs gap-1 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Total Debit</span>
          <span className="tabular-nums">{formatCurrency(totalDebit)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Total Credit</span>
          <span className="tabular-nums">{formatCurrency(totalCredit)}</span>
        </div>
        <div className={`flex justify-between border-t pt-1 font-semibold ${balanced ? "text-emerald-600" : "text-destructive"}`}>
          <span>{balanced ? "Balanced" : "Not Balanced"}</span>
          <span className="tabular-nums">{formatCurrency(Math.abs(totalDebit - totalCredit))}</span>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" disabled={isPending} onClick={() => submit("draft")}>
          Save as Draft
        </Button>
        <Button type="button" disabled={isPending || !balanced} onClick={() => submit("posted")}>
          {isPending ? "Posting..." : "Post Voucher"}
        </Button>
      </div>
    </div>
  );
}
