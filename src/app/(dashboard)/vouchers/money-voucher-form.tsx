"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SearchSelect, type SearchOption } from "@/components/search-select";
import type { Ledger } from "@/types/database";
import type { MoneyAccount } from "@/lib/accounting/system-ledgers";
import { VOUCHER_META } from "@/lib/accounting/voucher-meta";
import { round2 } from "@/lib/accounting/gst";
import { formatCurrency, formatDate } from "@/lib/accounting/format";
import type { CreateVoucherPayload } from "@/lib/accounting/voucher-payload";
import { postVoucher, getOutstandingBillsForLedger } from "./actions";

type PendingBill = { bill_id: string; bill_no: string; bill_date: string; outstanding_amount: number };

/**
 * Money Received (mode "in") and Money Paid (mode "out"). The user only says who, how much and
 * cash or bank — the debit/credit lines and the bill-wise settlement (oldest bill first) are built here.
 */
export function MoneyVoucherForm({
  mode,
  parties,
  expenseAccounts = [],
  moneyAccounts,
}: {
  mode: "in" | "out";
  parties: Ledger[];
  expenseAccounts?: { id: string; name: string }[];
  moneyAccounts: MoneyAccount[];
}) {
  const meta = mode === "in" ? VOUCHER_META.RCPT : VOUCHER_META.PMT;
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const cashAccount = moneyAccounts.find((a) => a.isCash) ?? moneyAccounts[0];

  const [kind, setKind] = useState<"party" | "expense">("party");
  const [partyId, setPartyId] = useState("");
  const [expenseId, setExpenseId] = useState("");
  const [amount, setAmount] = useState("");
  const [accountId, setAccountId] = useState(cashAccount?.id ?? "");
  const [voucherDate, setVoucherDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [referenceNo, setReferenceNo] = useState("");
  const [narration, setNarration] = useState("");
  const [bills, setBills] = useState<PendingBill[]>([]);

  const isExpense = mode === "out" && kind === "expense";

  useEffect(() => {
    if (!isExpense && partyId) {
      getOutstandingBillsForLedger(partyId, mode === "in" ? "receivable" : "payable").then((rows) =>
        setBills(rows.map((b) => ({ bill_id: b.bill_id, bill_no: b.bill_no, bill_date: b.bill_date, outstanding_amount: b.outstanding_amount })))
      );
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- clearing stale results, not reacting to new data
      setBills([]);
    }
  }, [isExpense, partyId, mode]);

  const partyOptions: SearchOption[] = useMemo(
    () => parties.map((p) => ({ value: p.id, label: p.name, hint: p.phone ?? undefined })),
    [parties]
  );
  const expenseOptions: SearchOption[] = useMemo(
    () => expenseAccounts.map((e) => ({ value: e.id, label: e.name })),
    [expenseAccounts]
  );

  const totalPending = round2(bills.reduce((s, b) => s + b.outstanding_amount, 0));
  const amountNum = parseFloat(amount) || 0;

  // Settle the oldest bills first; anything beyond the pending total stays as an advance
  const allocations = useMemo(
    () =>
      bills.reduce<(PendingBill & { applied: number })[]>((acc, b) => {
        const used = acc.reduce((s, a) => s + a.applied, 0);
        const applied = round2(Math.max(0, Math.min(amountNum - used, b.outstanding_amount)));
        return [...acc, { ...b, applied }];
      }, []),
    [bills, amountNum]
  );
  const advance = round2(amountNum - allocations.reduce((s, a) => s + a.applied, 0));

  function reset() {
    setPartyId("");
    setExpenseId("");
    setAmount("");
    setReferenceNo("");
    setNarration("");
  }

  function submit() {
    const counterId = isExpense ? expenseId : partyId;
    if (!counterId) {
      toast.error(isExpense ? "Select what the expense was for" : `Select the ${mode === "in" ? "customer" : "supplier"}`);
      return;
    }
    if (!(amountNum > 0)) {
      toast.error("Enter the amount");
      return;
    }
    if (!accountId) {
      toast.error("Select cash or bank");
      return;
    }

    const money = { ledger_id: accountId, debit_amount: mode === "in" ? amountNum : 0, credit_amount: mode === "in" ? 0 : amountNum };
    const counter = { ledger_id: counterId, debit_amount: mode === "in" ? 0 : amountNum, credit_amount: mode === "in" ? amountNum : 0 };
    const bill_allocations = allocations.filter((a) => a.applied > 0).map((a) => ({ bill_id: a.bill_id, amount: a.applied }));

    const payload: CreateVoucherPayload = {
      voucher_type_code: meta.code,
      voucher_date: voucherDate,
      party_ledger_id: isExpense ? undefined : partyId,
      reference_no: referenceNo || undefined,
      narration: narration || undefined,
      status: "posted",
      total_amount: amountNum,
      ledger_entries: mode === "in" ? [money, counter] : [counter, money],
      bill_allocations: bill_allocations.length > 0 ? bill_allocations : undefined,
    };

    startTransition(async () => {
      try {
        await postVoucher(payload, meta.path);
        toast.success(`${mode === "in" ? "Received" : "Paid"} ${formatCurrency(amountNum)}`);
        router.refresh();
        reset();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to save");
      }
    });
  }

  return (
    <div className="grid max-w-3xl gap-6">
      {mode === "out" && (
        <Tabs value={kind} onValueChange={(v) => setKind(v as "party" | "expense")}>
          <TabsList>
            <TabsTrigger value="party">Pay a Supplier</TabsTrigger>
            <TabsTrigger value="expense">Shop Expense</TabsTrigger>
          </TabsList>
        </Tabs>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label>{isExpense ? "Expense for" : mode === "in" ? "Received from" : "Paid to"}</Label>
          {isExpense ? (
            <SearchSelect options={expenseOptions} value={expenseId} onChange={setExpenseId} placeholder="Rent, salary, transport..." />
          ) : (
            <SearchSelect
              options={partyOptions}
              value={partyId}
              onChange={setPartyId}
              placeholder={`Search ${mode === "in" ? "customer" : "supplier"}...`}
            />
          )}
        </div>
        <div className="grid gap-1.5">
          <Label>Amount (₹)</Label>
          <Input
            type="number"
            step="0.01"
            min="0"
            className="text-lg font-semibold"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
        <div className="grid gap-1.5">
          <Label>{mode === "in" ? "Received in" : "Paid from"}</Label>
          <Select value={accountId} onValueChange={(v) => setAccountId(v ?? "")}>
            <SelectTrigger className="w-full">
              <SelectValue>{(v: string) => moneyAccounts.find((a) => a.id === v)?.name ?? ""}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {moneyAccounts.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.name}
                  {a.isCash ? "" : " (UPI / Card / Cheque / Bank)"}
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
          <Label>Cheque / UPI ref.</Label>
          <Input value={referenceNo} onChange={(e) => setReferenceNo(e.target.value)} placeholder="Optional" />
        </div>
        <div className="grid gap-1.5">
          <Label>Note</Label>
          <Input value={narration} onChange={(e) => setNarration(e.target.value)} placeholder="Optional" />
        </div>
      </div>

      {!isExpense && partyId && (
        <div className="rounded-md border p-4 text-sm">
          <div className="mb-3 flex items-center justify-between gap-2">
            <span className="font-medium">
              Pending bills: <span className="tabular-nums">{formatCurrency(totalPending)}</span>
            </span>
            {totalPending > 0 && (
              <Button type="button" variant="outline" size="sm" onClick={() => setAmount(totalPending.toString())}>
                {mode === "in" ? "Receive full amount" : "Pay full amount"}
              </Button>
            )}
          </div>
          {bills.length === 0 ? (
            <p className="text-muted-foreground">No pending bills — this amount will be kept as an advance.</p>
          ) : (
            <div className="grid gap-1">
              {allocations.map((a) => (
                <div key={a.bill_id} className="flex justify-between gap-2">
                  <span>
                    {a.bill_no} <span className="text-muted-foreground">({formatDate(a.bill_date)})</span>
                  </span>
                  <span className="tabular-nums">
                    {formatCurrency(a.outstanding_amount)}
                    {a.applied > 0 && (
                      <span className="ml-2 text-emerald-600">
                        − {formatCurrency(a.applied)}
                        {a.applied >= a.outstanding_amount ? " (cleared)" : ""}
                      </span>
                    )}
                  </span>
                </div>
              ))}
              {advance > 0 && (
                <p className="mt-2 text-muted-foreground">Extra {formatCurrency(advance)} will be kept as an advance.</p>
              )}
            </div>
          )}
        </div>
      )}

      <div className="flex justify-end">
        <Button type="button" size="lg" disabled={isPending} onClick={submit}>
          {isPending ? "Saving..." : mode === "in" ? "Save Money Received" : "Save Payment"}
        </Button>
      </div>
    </div>
  );
}
