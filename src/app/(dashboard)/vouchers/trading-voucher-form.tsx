"use client";

import { useEffect, useMemo, useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Printer, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SearchSelect, type SearchOption } from "@/components/search-select";
import type { Ledger, StockItem, UnitOfMeasure } from "@/types/database";
import type { VoucherMeta } from "@/lib/accounting/voucher-meta";
import type { MoneyAccount } from "@/lib/accounting/system-ledgers";
import { isInterstateSupply, splitGst, round2 } from "@/lib/accounting/gst";
import { formatCurrency, formatNumber } from "@/lib/accounting/format";
import type { CreateVoucherPayload, InventoryEntryInput, LedgerEntryInput } from "@/lib/accounting/voucher-payload";
import { postVoucher, getOutstandingBillsForLedger } from "./actions";

export const WALK_IN_CUSTOMER = "Walk-in Customer";

/** "credit" = add to the party's account (pay later / adjust against a bill); otherwise a cash/bank ledger id. */
const ON_ACCOUNT = "credit";

interface Row {
  key: string;
  stock_item_id: string;
  quantity: string;
  rate: string;
}

function emptyRow(): Row {
  return { key: crypto.randomUUID(), stock_item_id: "", quantity: "", rate: "" };
}

export function TradingVoucherForm({
  meta,
  partyRole,
  parties,
  stockItems,
  stockBalances,
  units,
  moneyAccounts,
  companyState,
  systemLedgers,
  addPartyButton,
}: {
  meta: VoucherMeta;
  partyRole: "customer" | "supplier";
  parties: Ledger[];
  stockItems: StockItem[];
  /** Current quantity on hand per item id, shown while picking items. */
  stockBalances: Record<string, number>;
  units: UnitOfMeasure[];
  moneyAccounts: MoneyAccount[];
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
    roundOffId: string;
  };
  addPartyButton?: ReactNode;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const isSale = meta.code === "SALE";
  const isReturn = meta.code === "CNOTE" || meta.code === "DNOTE";
  const isOutward = meta.code === "SALE" || meta.code === "CNOTE"; // uses the sales-side accounts
  const walkIn = parties.find((p) => p.name === WALK_IN_CUSTOMER);
  const cashAccount = moneyAccounts.find((a) => a.isCash) ?? moneyAccounts[0];

  // Counter sales default to walk-in + cash; purchases default to the supplier's account (pay later)
  const defaultPartyId = isSale ? (walkIn?.id ?? "") : "";
  const defaultSettle = isSale || isReturn ? (cashAccount?.id ?? ON_ACCOUNT) : ON_ACCOUNT;

  const [partyId, setPartyId] = useState(defaultPartyId);
  const [settleWith, setSettleWith] = useState(defaultSettle);
  const [voucherDate, setVoucherDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [referenceNo, setReferenceNo] = useState("");
  const [narration, setNarration] = useState("");
  const [isInterstate, setIsInterstate] = useState(false);
  const [pricesIncludeGst, setPricesIncludeGst] = useState(false);
  const [rows, setRows] = useState<Row[]>([emptyRow()]);

  const [billId, setBillId] = useState("");
  const [outstandingBills, setOutstandingBills] = useState<{ bill_id: string; bill_no: string; outstanding_amount: number }[]>([]);

  const party = parties.find((p) => p.id === partyId);
  const onAccount = settleWith === ON_ACCOUNT;

  // Reset the interstate flag from the newly selected party's state during render (React's
  // recommended alternative to an effect); the switch still allows a manual override.
  const [lastPartyId, setLastPartyId] = useState(partyId);
  if (partyId !== lastPartyId) {
    setLastPartyId(partyId);
    setIsInterstate(isInterstateSupply(companyState, party?.state));
  }

  useEffect(() => {
    // Returns adjusted "on account" must name the original bill; fetch that party's open bills.
    if (isReturn && onAccount && partyId) {
      const direction = partyRole === "customer" ? "receivable" : "payable";
      getOutstandingBillsForLedger(partyId, direction).then((bills) =>
        setOutstandingBills(bills.map((b) => ({ bill_id: b.bill_id, bill_no: b.bill_no, outstanding_amount: b.outstanding_amount })))
      );
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- clearing stale results, not reacting to new data
      setOutstandingBills([]);
      setBillId("");
    }
  }, [isReturn, onAccount, partyId, partyRole]);

  const itemsById = useMemo(() => new Map(stockItems.map((i) => [i.id, i])), [stockItems]);
  const unitsById = useMemo(() => new Map(units.map((u) => [u.id, u])), [units]);

  const itemOptions: SearchOption[] = useMemo(
    () =>
      stockItems.map((it) => {
        const unit = unitsById.get(it.unit_id);
        const qty = stockBalances[it.id] ?? 0;
        return {
          value: it.id,
          label: [it.name, it.brand, it.size, it.thickness_mm ? `${it.thickness_mm}mm` : null].filter(Boolean).join(" · "),
          hint: `${formatNumber(qty)} ${unit?.symbol ?? ""} in stock`,
        };
      }),
    [stockItems, unitsById, stockBalances]
  );

  const partyOptions: SearchOption[] = useMemo(
    () => parties.map((p) => ({ value: p.id, label: p.name, hint: p.phone ?? undefined })),
    [parties]
  );

  const lineTotals = rows.map((r) => {
    const qty = parseFloat(r.quantity) || 0;
    const rate = parseFloat(r.rate) || 0;
    const gross = round2(qty * rate);
    const item = itemsById.get(r.stock_item_id);
    const gstRate = item?.gst_rate ?? 0;
    // When prices include GST, back the tax out so the bill still shows a proper taxable value
    const taxable = pricesIncludeGst ? round2((gross * 100) / (100 + gstRate)) : gross;
    const gst = splitGst(taxable, gstRate, isInterstate);
    return { qty, taxable, gst, lineTotal: round2(taxable + gst.cgst + gst.sgst + gst.igst) };
  });

  const subtotal = round2(lineTotals.reduce((s, l) => s + l.taxable, 0));
  const totalCgst = round2(lineTotals.reduce((s, l) => s + l.gst.cgst, 0));
  const totalSgst = round2(lineTotals.reduce((s, l) => s + l.gst.sgst, 0));
  const totalIgst = round2(lineTotals.reduce((s, l) => s + l.gst.igst, 0));
  const exactTotal = round2(subtotal + totalCgst + totalSgst + totalIgst);
  const grandTotal = Math.round(exactTotal);
  const roundOff = round2(grandTotal - exactTotal);

  function updateRow(key: string, patch: Partial<Row>) {
    setRows((rs) => {
      const next = rs.map((r) => (r.key === key ? { ...r, ...patch } : r));
      // Always keep one blank line at the bottom so the next item can be added straight away
      const last = next[next.length - 1];
      return last.stock_item_id ? [...next, emptyRow()] : next;
    });
  }

  function removeRow(key: string) {
    setRows((rs) => {
      const next = rs.filter((r) => r.key !== key);
      return next.length === 0 || next[next.length - 1].stock_item_id ? [...next, emptyRow()] : next;
    });
  }

  function defaultRateFor(item: StockItem): number {
    const usesPurchasePrice = meta.code === "PURC" || meta.code === "DNOTE";
    return usesPurchasePrice ? item.purchase_rate || item.standard_rate : item.standard_rate;
  }

  function buildPayload(): CreateVoucherPayload | null {
    if (!partyId) {
      toast.error(`Select a ${partyRole}`);
      return null;
    }
    if (onAccount && party?.name === WALK_IN_CUSTOMER) {
      toast.error("A walk-in customer must pay now. For credit, pick or add the customer by name.");
      return null;
    }
    const validRows = rows.filter((r) => r.stock_item_id && parseFloat(r.quantity) > 0 && parseFloat(r.rate) >= 0);
    if (validRows.length === 0) {
      toast.error("Add at least one item with a quantity");
      return null;
    }
    if (isReturn && onAccount && !billId) {
      toast.error("Select the bill this return should be adjusted against, or choose a cash/bank refund");
      return null;
    }

    const inventory_entries: InventoryEntryInput[] = rows.flatMap((r, idx) => {
      if (!validRows.includes(r)) return [];
      const { qty, taxable } = lineTotals[idx];
      return [{ stock_item_id: r.stock_item_id, quantity: qty, rate: round2(taxable / qty), amount: taxable }];
    });

    const taxLedgers = isOutward
      ? { cgst: systemLedgers.outputCgstId, sgst: systemLedgers.outputSgstId, igst: systemLedgers.outputIgstId }
      : { cgst: systemLedgers.inputCgstId, sgst: systemLedgers.inputSgstId, igst: systemLedgers.inputIgstId };
    const tradingLedgerId = isOutward ? systemLedgers.salesAccountId : systemLedgers.purchaseAccountId;
    const partyDebits = meta.partySide === "debit";
    const line = (ledger_id: string, amount: number, onPartySide: boolean): LedgerEntryInput => {
      const debit = onPartySide === partyDebits;
      return { ledger_id, debit_amount: debit ? amount : 0, credit_amount: debit ? 0 : amount };
    };

    // Paid now → the cash/bank account takes the party's place (Tally-style cash sale/purchase)
    const ledger_entries: LedgerEntryInput[] = [line(onAccount ? partyId : settleWith, grandTotal, true)];
    ledger_entries.push(line(tradingLedgerId, subtotal, false));
    if (totalCgst > 0) ledger_entries.push(line(taxLedgers.cgst, totalCgst, false));
    if (totalSgst > 0) ledger_entries.push(line(taxLedgers.sgst, totalSgst, false));
    if (totalIgst > 0) ledger_entries.push(line(taxLedgers.igst, totalIgst, false));
    if (roundOff > 0) ledger_entries.push(line(systemLedgers.roundOffId, roundOff, false));
    if (roundOff < 0) ledger_entries.push(line(systemLedgers.roundOffId, -roundOff, true));

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
      status: "posted",
      total_amount: grandTotal,
      ledger_entries,
      inventory_entries,
      tax_details,
    };

    if (onAccount && !isReturn) {
      payload.new_bill = {
        due_date: party?.credit_days
          ? new Date(new Date(voucherDate).getTime() + party.credit_days * 86400000).toISOString().slice(0, 10)
          : undefined,
      };
    } else if (onAccount && isReturn) {
      payload.bill_allocations = [{ bill_id: billId, amount: grandTotal }];
    }

    return payload;
  }

  function submit(print: boolean) {
    const payload = buildPayload();
    if (!payload) return;
    // Open the tab synchronously so the browser doesn't treat it as an unwanted popup
    const printWindow = print ? window.open("", "_blank") : null;
    startTransition(async () => {
      try {
        const voucherId = await postVoucher(payload, meta.path);
        toast.success(`${meta.label} saved — ${formatCurrency(grandTotal)}`);
        if (printWindow) printWindow.location.href = `/api/invoices/${voucherId}/pdf`;
        router.refresh();
        setRows([emptyRow()]);
        setPartyId(defaultPartyId);
        setSettleWith(defaultSettle);
        setReferenceNo("");
        setNarration("");
      } catch (e) {
        printWindow?.close();
        toast.error(e instanceof Error ? e.message : "Failed to save");
      }
    });
  }

  const settleLabel = isReturn
    ? partyRole === "customer"
      ? "Refund"
      : "Refund received"
    : partyRole === "customer"
      ? "Payment"
      : "Paid";
  const onAccountLabel = isReturn ? "Adjust against a pending bill" : "Credit (pay later)";

  return (
    <div className="grid gap-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="grid gap-1.5 lg:col-span-2">
          <Label>{partyRole === "customer" ? "Customer" : "Supplier"}</Label>
          <div className="flex gap-2">
            <div className="flex-1">
              <SearchSelect
                options={partyOptions}
                value={partyId}
                onChange={setPartyId}
                placeholder={`Search ${partyRole} by name...`}
              />
            </div>
            {addPartyButton}
          </div>
        </div>
        <div className="grid gap-1.5">
          <Label>{settleLabel}</Label>
          <Select value={settleWith} onValueChange={(v) => setSettleWith(v ?? ON_ACCOUNT)}>
            <SelectTrigger className="w-full">
              <SelectValue>
                {(v: string) => (v === ON_ACCOUNT ? onAccountLabel : (moneyAccounts.find((a) => a.id === v)?.name ?? ""))}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {moneyAccounts.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.name}
                  {a.isCash ? "" : " (UPI / Card / Bank)"}
                </SelectItem>
              ))}
              <SelectItem value={ON_ACCOUNT}>{onAccountLabel}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-1.5">
          <Label>Date</Label>
          <Input type="date" value={voucherDate} onChange={(e) => setVoucherDate(e.target.value)} />
        </div>
      </div>

      {isReturn && onAccount && (
        <div className="grid gap-1.5 sm:max-w-sm">
          <Label>Adjust against bill</Label>
          <Select value={billId} onValueChange={(v) => setBillId(v ?? "")}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder={partyId ? "Select the original bill" : `Select a ${partyRole} first`}>
                {(v: string) => outstandingBills.find((b) => b.bill_id === v)?.bill_no ?? ""}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {outstandingBills.map((b) => (
                <SelectItem key={b.bill_id} value={b.bill_id}>
                  {b.bill_no} — pending {formatCurrency(b.outstanding_amount)}
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
              <TableHead className="w-8">#</TableHead>
              <TableHead className="min-w-64">Item</TableHead>
              <TableHead className="w-28">Qty</TableHead>
              <TableHead className="w-32">Rate (₹)</TableHead>
              <TableHead className="w-16 text-right">GST</TableHead>
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
                  <TableCell className="text-muted-foreground">{idx + 1}</TableCell>
                  <TableCell>
                    <SearchSelect
                      options={itemOptions}
                      value={row.stock_item_id}
                      placeholder="Search item, brand or size..."
                      emptyText="No such item — add it under Items & Stock"
                      onChange={(v) => {
                        const picked = itemsById.get(v);
                        if (!picked) return;
                        updateRow(row.key, {
                          stock_item_id: v,
                          quantity: row.quantity || "1",
                          rate: defaultRateFor(picked).toString(),
                        });
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        step="any"
                        min="0"
                        value={row.quantity}
                        onChange={(e) => updateRow(row.key, { quantity: e.target.value })}
                      />
                      {unit && <span className="text-xs text-muted-foreground">{unit.symbol}</span>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={row.rate}
                      onChange={(e) => updateRow(row.key, { rate: e.target.value })}
                    />
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground tabular-nums">
                    {item ? `${item.gst_rate}%` : ""}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {row.stock_item_id ? formatCurrency(lineTotals[idx]?.lineTotal ?? 0) : ""}
                  </TableCell>
                  <TableCell>
                    {row.stock_item_id && (
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeRow(row.key)} title="Remove line">
                        <Trash2 className="size-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="grid content-start gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label>{partyRole === "supplier" ? "Supplier's bill no." : "Reference / Vehicle no."}</Label>
              <Input value={referenceNo} onChange={(e) => setReferenceNo(e.target.value)} placeholder="Optional" />
            </div>
            <div className="grid gap-1.5">
              <Label>Note</Label>
              <Input value={narration} onChange={(e) => setNarration(e.target.value)} placeholder="Optional" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={pricesIncludeGst} onCheckedChange={setPricesIncludeGst} id="incl-gst" />
            <Label htmlFor="incl-gst" className="font-normal">Rates include GST</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={isInterstate} onCheckedChange={setIsInterstate} id="interstate" />
            <Label htmlFor="interstate" className="font-normal">Other-state party (IGST)</Label>
          </div>
        </div>

        <div className="grid content-start gap-1 text-sm md:ml-auto md:w-72">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Taxable value</span>
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
          {roundOff !== 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Round off</span>
              <span className="tabular-nums">{formatCurrency(roundOff)}</span>
            </div>
          )}
          <div className="mt-1 flex justify-between border-t pt-2 text-xl font-semibold">
            <span>Total</span>
            <span className="tabular-nums">{formatCurrency(grandTotal)}</span>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        {isSale && (
          <Button type="button" variant="outline" size="lg" disabled={isPending} onClick={() => submit(true)}>
            <Printer className="size-4" />
            Save &amp; Print
          </Button>
        )}
        <Button type="button" size="lg" disabled={isPending} onClick={() => submit(false)}>
          {isPending ? "Saving..." : `Save ${meta.label}`}
        </Button>
      </div>
    </div>
  );
}
