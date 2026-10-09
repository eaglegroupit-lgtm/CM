"use client";

import { useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EntityDialog } from "@/components/masters/entity-dialog";
import { createAccount, type AccountKind } from "./actions";

const KIND_LABELS: Record<AccountKind, { label: string; opening: string; placeholder: string }> = {
  bank: { label: "Bank account", opening: "Money in this bank now (₹)", placeholder: "e.g. SBI Current A/c" },
  cash: { label: "Cash drawer / cash box", opening: "Cash in hand now (₹)", placeholder: "e.g. Counter Cash" },
  expense: { label: "Expense head", opening: "", placeholder: "e.g. Diesel, Packing Material" },
  income: { label: "Other income", opening: "", placeholder: "e.g. Cutting Charges, Commission" },
  capital: { label: "Owner's capital", opening: "Capital invested (₹)", placeholder: "e.g. Owner Capital" },
  loan: { label: "Loan taken", opening: "Loan amount pending (₹)", placeholder: "e.g. Bank Loan" },
};

export function LedgerCreateDialog() {
  return (
    <EntityDialog triggerLabel="New Account" title="Add Account">
      {(close) => <AccountForm onDone={close} />}
    </EntityDialog>
  );
}

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  kind: z.enum(["bank", "cash", "expense", "income", "capital", "loan"]),
  opening_balance: z.coerce.number().min(0),
  bank_account_no: z.string().optional(),
  bank_ifsc: z.string().optional(),
});

type FormInput = z.input<typeof schema>;
type FormValues = z.output<typeof schema>;

function AccountForm({ onDone }: { onDone: () => void }) {
  const [isPending, startTransition] = useTransition();
  const form = useForm<FormInput, unknown, FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", kind: "expense", opening_balance: 0, bank_account_no: "", bank_ifsc: "" },
  });
  const kind = useWatch({ control: form.control, name: "kind" });
  const meta = KIND_LABELS[kind];

  function onSubmit(values: FormValues) {
    startTransition(async () => {
      try {
        await createAccount(meta.opening ? values : { ...values, opening_balance: 0 });
        toast.success("Account added");
        onDone();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to add account");
      }
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
        <FormField
          control={form.control}
          name="kind"
          render={({ field }) => (
            <FormItem>
              <FormLabel>What is it?</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue>{(v: AccountKind) => KIND_LABELS[v]?.label ?? ""}</SelectValue>
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {(Object.keys(KIND_LABELS) as AccountKind[]).map((k) => (
                    <SelectItem key={k} value={k}>
                      {KIND_LABELS[k].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder={meta.placeholder} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {meta.opening && (
          <FormField
            control={form.control}
            name="opening_balance"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{meta.opening}</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" {...field} value={(field.value as number | string | undefined) ?? ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        {kind === "bank" && (
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="bank_account_no"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Account No.</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="bank_ifsc"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>IFSC</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving..." : "Add Account"}
        </Button>
      </form>
    </Form>
  );
}
