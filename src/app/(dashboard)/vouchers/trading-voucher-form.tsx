"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Godown, Ledger, StockItem, UnitOfMeasure } from "@/types/database";
import type { VoucherMeta } from "@/lib/accounting/voucher-meta";
import { isInterstateSupply, splitGst, round2 } from "@/lib/accounting/gst";
import { formatCurrency } from "@/lib/accounting/format";
import type { CreateVoucherPayload, InventoryEntryInput, LedgerEntryInput } from "@/lib/accounting/voucher-payload";
import type { LotBalanceRow } from "@/types/database";
import { postVoucher, getOutstandingBillsForLedger, getAvailableLotsForItem } from "./actions";

interface Row {
  key: string;
  stock_item_id: string;
  godown_id: string;
  lot_id: string;
  new_lot_no: string;
  new_bundle_no: string;
  new_thickness_mm: string;
  quantity: string;
  rate: string;
}

function emptyRow(defaultGodownId: string): Row {
  return {
    key: crypto.randomUUID(),
    stock_item_id: "",
    godown_id: defaultGodownId,
    lot_id: "",
    new_lot_no: "",
    new_bundle_no: "",
    new_thickness_mm: "",
    quantity: "",
    rate: "",
  };
}

export function TradingVoucherForm({
  meta,
  partyRole,
  parties,
  stockItems,
  units,
  godowns,
  companyState,
  systemLedgers,
}: {
  meta: VoucherMeta;
  partyRole: "customer" | "supplier";
  parties: Ledger[];
  stockItems: StockItem[];
  units: UnitOfMeasure[];
  godowns: Godown[];
  companyState: string;
  systemLedgers: {
    salesAccountId: string;
    purchaseAccountId: string;
    outputCgstId: string;
    outputSgstId: string;
    outputIgstId: string;
    inputCgstId: string;
    inputSgstId: string;
    inputIgstId: string;
  };
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const defaultGodownId = godowns.find((g) => g.is_default)?.id ?? godowns[0]?.id ?? "";

  const [partyId, setPartyId] = useState("");
  const [voucherDate, setVoucherDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [referenceNo, setReferenceNo] = useState("");
  const [narration, setNarration] = useState("");
  const [isInterstate, setIsInterstate] = useState(false);
  const [rows, setRows] = useState<Row[]>([emptyRow(defaultGodownId)]);

  const [billId, setBillId] = useState("");
  const [outstandingBills, setOutstandingBills] = useState<{ bill_id: string; bill_no: string; outstanding_amount: number }[]>([]);
  const [lotsByRow, setLotsByRow] = useState<Record<string, LotBalanceRow[]>>({});

  const party = parties.find((p) => p.id === partyId);
  const isReturn = meta.code === "CNOTE" || meta.code === "DNOTE";

  // Reset the interstate flag from the newly selected party's state, right during render
  // (React's recommended alternative to an effect for "adjust state when a prop changes") —
  // the Switch below still lets the accountant override the computed value afterward.
  const [lastPartyId, setLastPartyId] = useState(partyId);
  if (partyId !== lastPartyId) {
    setLastPartyId(partyId);
    setIsInterstate(isInterstateSupply(companyState, party?.state));
  }

  useEffect(() => {
    // Legitimate data fetch keyed off the selected party/voucher type; the else branch
    // just clears stale results from the previous party rather than reacting to new data.
    if (isReturn && partyId) {
      const direction = partyRole === "customer" ? "receivable" : "payable";
      getOutstandingBillsForLedger(partyId, direction).then((bills) =>
        setOutstandingBills(bills.map((b) => ({ bill_id: b.bill_id, bill_no: b.bill_no, outstanding_amount: b.outstanding_amount })))
      );
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- clearing stale results, not reacting to new data
      setOutstandingBills([]);
      setBillId("");
    }
  }, [isReturn, partyId, partyRole]);

  const itemsById = useMemo(() => new Map(stockItems.map((i) => [i.id, i])), [stockItems]);
  const unitsById = useMemo(() => new Map(units.map((u) => [u.id, u])), [units]);

  const lineTotals = rows.map((r) => {
    const qty = parseFloat(r.quantity) || 0;
    const rate = parseFloat(r.rate) || 0;
    const amount = round2(qty * rate);
    const item = itemsById.get(r.stock_item_id);
    const gst = item ? splitGst(amount, item.gst_rate, isInterstate) : { cgst: 0, sgst: 0, igst: 0, isInterstate };
    return { qty, rate, amount, gst };
  });

  const subtotal = round2(lineTotals.reduce((s, l) => s + l.amount, 0));
  const totalCgst = round2(lineTotals.reduce((s, l) => s + l.gst.cgst, 0));
  const totalSgst = round2(lineTotals.reduce((s, l) => s + l.gst.sgst, 0));
  const totalIgst = round2(lineTotals.reduce((s, l) => s + l.gst.igst, 0));
  const grandTotal = round2(subtotal + totalCgst + totalSgst + totalIgst);

  function updateRow(key: string, patch: Partial<Row>) {
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }

  function loadLotsForRow(rowKey: string, itemId: string) {
    getAvailableLotsForItem(itemId).then((lots) => setLotsByRow((prev) => ({ ...prev, [rowKey]: lots })));
  }

  function addRow() {
    setRows((rs) => [...rs, emptyRow(defaultGodownId)]);
  }

  function removeRow(key: string) {
    setRows((rs) => (rs.length > 1 ? rs.filter((r) => r.key !== key) : rs));
  }

  function resolveTaxLedgers(taxAccount: "output" | "input") {
    return taxAccount === "output"
      ? { cgst: systemLedgers.outputCgstId, sgst: systemLedgers.outputSgstId, igst: systemLedgers.outputIgstId }
      : { cgst: systemLedgers.inputCgstId, sgst: systemLedgers.inputSgstId, igst: systemLedgers.inputIgstId };
  }

  function buildPayload(status: "draft" | "posted"): CreateVoucherPayload | null {
    if (!partyId) {
      toast.error("Select a party");
      return null;
    }
    const validRows = rows.filter((r) => r.stock_item_id && parseFloat(r.quantity) > 0 && parseFloat(r.rate) >= 0);
    if (validRows.length === 0) {
      toast.error("Add at least one item line");
      return null;
    }
    if (isReturn && !billId) {
      toast.error("Select the bill this note is adjusting");
      return null;
    }
    if (meta.stockMoveDirection === "out") {
      for (const r of validRows) {
        const item = itemsById.get(r.stock_item_id);
        const availableLots = lotsByRow[r.key] ?? [];
        if (item?.tracks_lots && availableLots.length > 0 && !r.lot_id) {
          toast.error(`Select a lot for "${item.name}" — ${availableLots.length} lot(s) available`);
          return null;
        }
      }
    }

    const inventory_entries: InventoryEntryInput[] = validRows.map((r) => {
      const qty = parseFloat(r.quantity);
      const rate = parseFloat(r.rate);
      const item = itemsById.get(r.stock_item_id)!;
      const entry: InventoryEntryInput = {
        stock_item_id: r.stock_item_id,
        godown_id: r.godown_id || defaultGodownId,
        quantity: qty,
        rate,
        amount: round2(qty * rate),
      };
      if (r.lot_id) {
        entry.lot_id = r.lot_id;
      } else if (item.tracks_lots && r.new_lot_no) {
        entry.new_lot = {
          lot_no: r.new_lot_no,
          bundle_no: r.new_bundle_no || undefined,
          thickness_mm: r.new_thickness_mm ? parseFloat(r.new_thickness_mm) : undefined,
        };
      }
      return entry;
    });

    const ledger_entries: LedgerEntryInput[] = [];
    const taxLedgers = resolveTaxLedgers(meta.code === "SALE" || meta.code === "CNOTE" ? "output" : "input");
    const tradingLedgerId = meta.code === "SALE" || meta.code === "CNOTE" ? systemLedgers.salesAccountId : systemLedgers.purchaseAccountId;

    const partyDebits = meta.partySide === "debit";

    // Party line
    ledger_entries.push({
      ledger_id: partyId,
      debit_amount: partyDebits ? grandTotal : 0,
      credit_amount: partyDebits ? 0 : grandTotal,
    });
    // Trading account line (Sales/Purchase Account) — opposite side of the party
    ledger_entries.push({
      ledger_id: tradingLedgerId,
      debit_amount: partyDebits ? 0 : subtotal,
      credit_amount: partyDebits ? subtotal : 0,
    });
    if (totalCgst > 0) {
      ledger_entries.push({ ledger_id: taxLedgers.cgst, debit_amount: partyDebits ? 0 : totalCgst, credit_amount: partyDebits ? totalCgst : 0 });
    }
    if (totalSgst > 0) {
      ledger_entries.push({ ledger_id: taxLedgers.sgst, debit_amount: partyDebits ? 0 : totalSgst, credit_amount: partyDebits ? totalSgst : 0 });
    }
    if (totalIgst > 0) {
      ledger_entries.push({ ledger_id: taxLedgers.igst, debit_amount: partyDebits ? 0 : totalIgst, credit_amount: partyDebits ? totalIgst : 0 });
    }

    const tax_details = [
      totalCgst > 0 ? { tax_type: "CGST" as const, taxable_value: subtotal, rate: 0, amount: totalCgst } : null,
      totalSgst > 0 ? { tax_type: "SGST" as const, taxable_value: subtotal, rate: 0, amount: totalSgst } : null,
      totalIgst > 0 ? { tax_type: "IGST" as const, taxable_value: subtotal, rate: 0, amount: totalIgst } : null,
    ].filter((t): t is NonNullable<typeof t> => t !== null);

    const payload: CreateVoucherPayload = {
      voucher_type_code: meta.code,
      voucher_date: voucherDate,
      party_ledger_id: partyId,
      reference_no: referenceNo || undefined,
      narration: narration || undefined,
      place_of_supply: party?.state ?? companyState,
      is_interstate: isInterstate,
      status,
      ledger_entries,
      inventory_entries,
      tax_details,
    };

    if (!isReturn) {
      payload.new_bill = {
        due_date: party?.credit_days
          ? new Date(new Date(voucherDate).getTime() + party.credit_days * 86400000).toISOString().slice(0, 10)
          : undefined,
      };
    } else {
      payload.bill_allocations = [{ bill_id: billId, amount: grandTotal }];
    }

    return payload;
  }

  function submit(status: "draft" | "posted") {
    const payload = buildPayload(status);
    if (!payload) return;
    startTransition(async () => {
      try {
        await postVoucher(payload, `/vouchers/${meta.code.toLowerCase()}`);
        toast.success(`${meta.label} voucher ${status === "posted" ? "posted" : "saved as draft"}`);
        router.refresh();
        setRows([emptyRow(defaultGodownId)]);
        setPartyId("");
        setReferenceNo("");
        setNarration("");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to save voucher");
      }
    });
  }

  return (
    <div className="grid gap-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="grid gap-1.5">
          <Label>{partyRole === "customer" ? "Customer" : "Supplier"}</Label>
          <Select value={partyId} onValueChange={(v) => setPartyId(v ?? "")}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder={`Select ${partyRole}`} />
            </SelectTrigger>
            <SelectContent>
              {parties.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-1.5">
          <Label>Date</Label>
          <Input type="date" value={voucherDate} onChange={(e) => setVoucherDate(e.target.value)} />
        </div>
        <div className="grid gap-1.5">
          <Label>Reference No.</Label>
          <Input value={referenceNo} onChange={(e) => setReferenceNo(e.target.value)} placeholder="Optional" />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Switch checked={isInterstate} onCheckedChange={setIsInterstate} id="interstate" />
        <Label htmlFor="interstate">Inter-state supply (IGST instead of CGST+SGST)</Label>
      </div>

      {isReturn && (
        <div className="grid gap-1.5 sm:max-w-sm">
          <Label>Against Bill</Label>
          <Select value={billId} onValueChange={(v) => setBillId(v ?? "")}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select the original bill" />
            </SelectTrigger>
            <SelectContent>
              {outstandingBills.map((b) => (
                <SelectItem key={b.bill_id} value={b.bill_id}>
                  {b.bill_no} — outstanding {formatCurrency(b.outstanding_amount)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-48">Item</TableHead>
              <TableHead className="min-w-32">Godown</TableHead>
              <TableHead className="min-w-40">Lot / Bundle</TableHead>
              <TableHead className="w-28">Qty</TableHead>
              <TableHead className="w-32">Rate</TableHead>
              <TableHead className="w-32 text-right">Amount</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, idx) => {
              const item = itemsById.get(row.stock_item_id);
              const unit = item ? unitsById.get(item.unit_id) : undefined;
              return (
                <TableRow key={row.key}>
                  <TableCell>
                    <Select
                      value={row.stock_item_id}
                      onValueChange={(v) => {
                        if (!v) return;
                        updateRow(row.key, {
                          stock_item_id: v,
                          rate: itemsById.get(v)?.standard_rate.toString() ?? row.rate,
                          lot_id: "",
                        });
                        if (meta.stockMoveDirection === "out" && itemsById.get(v)?.tracks_lots) {
                          loadLotsForRow(row.key, v);
                        }
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select item" />
                      </SelectTrigger>
                      <SelectContent>
                        {stockItems.map((it) => (
                          <SelectItem key={it.id} value={it.id}>
                            {it.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Select value={row.godown_id} onValueChange={(v) => updateRow(row.key, { godown_id: v ?? "" })}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {godowns.map((g) => (
                          <SelectItem key={g.id} value={g.id}>
                            {g.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    {item?.tracks_lots ? (
                      meta.stockMoveDirection === "in" ? (
                        <div className="flex gap-1">
                          <Input
                            placeholder="Lot no."
                            className="w-20"
                            value={row.new_lot_no}
                            onChange={(e) => updateRow(row.key, { new_lot_no: e.target.value })}
                          />
                          <Input
                            placeholder="Bundle"
                            className="w-20"
                            value={row.new_bundle_no}
                            onChange={(e) => updateRow(row.key, { new_bundle_no: e.target.value })}
                          />
                        </div>
                      ) : (
                        <Select value={row.lot_id} onValueChange={(v) => updateRow(row.key, { lot_id: v ?? "" })}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="No specific lot" />
                          </SelectTrigger>
                          <SelectContent>
                            {(lotsByRow[row.key] ?? []).map((lot) => (
                              <SelectItem key={lot.lot_id} value={lot.lot_id}>
                                {lot.lot_no}
                                {lot.bundle_no ? ` / ${lot.bundle_no}` : ""} — {lot.remaining_qty} left
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      step="0.01"
                      value={row.quantity}
                      onChange={(e) => updateRow(row.key, { quantity: e.target.value })}
                    />
                    {unit && <span className="text-xs text-muted-foreground">{unit.symbol}</span>}
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      step="0.01"
                      value={row.rate}
                      onChange={(e) => updateRow(row.key, { rate: e.target.value })}
                    />
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{formatCurrency(lineTotals[idx]?.amount ?? 0)}</TableCell>
                  <TableCell>
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeRow(row.key)}>
                      <Trash2 className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        <div className="p-2">
          <Button type="button" variant="outline" size="sm" onClick={addRow}>
            <Plus className="size-4" />
            Add Row
          </Button>
        </div>
      </div>

      <div className="grid gap-1.5">
        <Label>Narration</Label>
        <Textarea value={narration} onChange={(e) => setNarration(e.target.value)} rows={2} />
      </div>

      <div className="ml-auto grid w-full max-w-xs gap-1 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Subtotal</span>
          <span className="tabular-nums">{formatCurrency(subtotal)}</span>
        </div>
        {totalCgst > 0 && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">CGST</span>
            <span className="tabular-nums">{formatCurrency(totalCgst)}</span>
          </div>
        )}
        {totalSgst > 0 && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">SGST</span>
            <span className="tabular-nums">{formatCurrency(totalSgst)}</span>
          </div>
        )}
        {totalIgst > 0 && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">IGST</span>
            <span className="tabular-nums">{formatCurrency(totalIgst)}</span>
          </div>
        )}
        <div className="flex justify-between border-t pt-1 font-semibold">
          <span>Total</span>
          <span className="tabular-nums">{formatCurrency(grandTotal)}</span>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" disabled={isPending} onClick={() => submit("draft")}>
          Save as Draft
        </Button>
        <Button type="button" disabled={isPending} onClick={() => submit("posted")}>
          {isPending ? "Posting..." : "Post Voucher"}
        </Button>
      </div>
    </div>
  );
}
